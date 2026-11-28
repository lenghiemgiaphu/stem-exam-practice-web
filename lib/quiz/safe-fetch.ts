import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import { pipeline } from 'node:stream/promises'
import { PassThrough, type Readable } from 'node:stream'
import zlib from 'node:zlib'
import { HttpError } from './errors'

/**
 * Tải HTML của một trang công khai để trích bài báo — có chống SSRF.
 *
 * Các lớp bảo vệ:
 *  1. Chỉ http/https, cổng 80/443, không nhúng tài khoản (user:pass@) vào URL.
 *  2. Danh sách chặn đầy đủ (net.BlockList): loopback, riêng tư, link-local (cả metadata cloud 169.254.169.254),
 *     CGNAT, multicast, dải tài liệu/thử nghiệm và các dạng IPv6 "bọc" IPv4 (::ffff:x, NAT64, 6to4...).
 *     Lưu ý: URL parser đổi [::ffff:127.0.0.1] thành [::ffff:7f00:1] nên phải so khớp theo dải, không so chuỗi.
 *  3. Địa chỉ được kiểm tra NGAY LÚC KẾT NỐI (hàm lookup của socket), không phải một lần DNS tách rời trước khi tải:
 *     kẻ tấn công không thể đổi bản ghi DNS (DNS rebinding) giữa bước kiểm tra và bước kết nối.
 *  4. Chuyển hướng (redirect) đi thủ công, tối đa 4 lần, mỗi bước đều kiểm tra lại từ đầu.
 *  5. Giới hạn thời gian (20 giây tổng) và dung lượng SAU KHI giải nén (2,5 MB) — chặn cả "zip bomb" HTTP.
 */

const MAX_BYTES = 2_500_000
const MAX_REDIRECTS = 4
const TOTAL_TIMEOUT_MS = 20_000
const IDLE_TIMEOUT_MS = 10_000

const IPV4_BLOCKED: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // link-local, metadata cloud
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // dành riêng + broadcast
]

const IPV6_BLOCKED: Array<[string, number]> = [
  ['::', 128],
  ['::1', 128],
  // KHÔNG thêm ::ffff:0:0/96 (IPv4-mapped) ở đây: net.BlockList tự áp các quy tắc IPv4 ở trên cho địa chỉ dạng
  // mapped (cả ::ffff:7f00:1 lẫn ::ffff:127.0.0.1), còn quy tắc này sẽ chặn nhầm TOÀN BỘ IPv4 vì BlockList coi
  // mọi IPv4 là một địa chỉ mapped.
  ['64:ff9b::', 96], // NAT64
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001::', 32], // Teredo
  ['2001:db8::', 32],
  ['2002::', 16], // 6to4
  ['fc00::', 7], // unique local
  ['fe80::', 10], // link-local
  ['fec0::', 10], // site-local (cũ)
  ['ff00::', 8], // multicast
]

const blockList = new net.BlockList()
for (const [address, prefix] of IPV4_BLOCKED) blockList.addSubnet(address, prefix, 'ipv4')
for (const [address, prefix] of IPV6_BLOCKED) blockList.addSubnet(address, prefix, 'ipv6')

/** true nếu địa chỉ KHÔNG được phép truy cập (đóng theo mặc định: chuỗi lạ cũng bị chặn). */
export function isPrivateIp(rawAddress: string): boolean {
  const address = rawAddress.replace(/^\[|\]$/g, '').split('%')[0]
  const family = net.isIPv4(address) ? 'ipv4' : net.isIPv6(address) ? 'ipv6' : null
  if (!family) return true
  return blockList.check(address, family)
}

class BlockedAddressError extends Error {
  code = 'EBLOCKED'
}

export interface PageFetchPolicy {
  /** Ghi đè bộ lọc địa chỉ (chỉ dùng cho test). Mặc định: isPrivateIp. */
  isBlocked?: (address: string) => boolean
  /** Ghi đè danh sách cổng được phép (chỉ dùng cho test). Mặc định: 80 và 443. */
  allowPort?: (port: string) => boolean
}

function charsetOf(contentType: string, head: Buffer): string {
  const fromHeader = contentType.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]
  const fromMeta = head.toString('latin1').match(/<meta[^>]+charset\s*=\s*["']?([\w-]+)/i)?.[1]
  return (fromHeader ?? fromMeta ?? 'utf-8').toLowerCase()
}

function decodeBody(buffer: Buffer, contentType: string): string {
  const charset = charsetOf(contentType, buffer.subarray(0, 2048))
  try {
    return new TextDecoder(charset).decode(buffer)
  } catch {
    return new TextDecoder('utf-8').decode(buffer)
  }
}

/** Đọc stream, dừng ngay khi vượt `cap` byte (đã giải nén) và trả phần đầu. */
async function readCapped(stream: Readable, cap: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    const remaining = cap - total
    chunks.push(buf.length > remaining ? buf.subarray(0, remaining) : buf)
    total += buf.length
    if (total >= cap) {
      stream.destroy()
      break
    }
  }
  return Buffer.concat(chunks)
}

function decoderFor(encoding: string) {
  switch (encoding.trim().toLowerCase()) {
    case '':
    case 'identity':
      return null
    case 'gzip':
    case 'x-gzip':
      return zlib.createGunzip()
    case 'deflate':
      return zlib.createInflate()
    case 'br':
      return zlib.createBrotliDecompress()
    default:
      throw new HttpError(502, 'Trang web dùng kiểu nén không được hỗ trợ.')
  }
}

export function createPageFetcher(policy: PageFetchPolicy = {}) {
  const isBlocked = policy.isBlocked ?? isPrivateIp
  const allowPort = policy.allowPort ?? ((port: string) => port === '' || port === '80' || port === '443')

  // Kiểm tra địa chỉ tại thời điểm kết nối: socket chỉ nối tới đúng địa chỉ đã được duyệt ở đây.
  const guardedLookup = ((hostname: string, options: dns.LookupOptions, callback: (...args: unknown[]) => void) => {
    dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
      if (error) return callback(error)
      const list = addresses as dns.LookupAddress[]
      if (!list.length || list.some((a) => isBlocked(a.address))) return callback(new BlockedAddressError())
      if (options.all) return callback(null, list)
      return callback(null, list[0].address, list[0].family)
    })
  }) as net.LookupFunction

  function assertAllowedUrl(url: URL) {
    if (!['http:', 'https:'].includes(url.protocol)) throw new HttpError(400, 'Chỉ hỗ trợ đường dẫn http hoặc https.')
    if (url.username || url.password) throw new HttpError(400, 'Đường dẫn không được chứa tài khoản hoặc mật khẩu.')
    if (!allowPort(url.port)) throw new HttpError(400, 'Đường dẫn không hợp lệ.')
    const host = url.hostname.replace(/^\[|\]$/g, '')
    // Socket không gọi lookup cho địa chỉ IP viết thẳng trong URL, nên chặn ở đây.
    if (net.isIP(host) && isBlocked(host)) throw new HttpError(400, 'Đường dẫn này không được phép truy cập.')
  }

  function request(url: URL, signal: AbortSignal): Promise<http.IncomingMessage> {
    const transport = url.protocol === 'https:' ? https : http
    return new Promise((resolve, reject) => {
      const req = transport.request(
        {
          method: 'GET',
          hostname: url.hostname.replace(/^\[|\]$/g, ''),
          port: url.port || undefined,
          path: `${url.pathname}${url.search}`,
          lookup: guardedLookup,
          agent: false,
          signal,
          timeout: IDLE_TIMEOUT_MS,
          headers: {
            host: url.host,
            'user-agent': 'Mozilla/5.0 (compatible; LabLuyenBot/1.0; +quiz-generator)',
            accept: 'text/html,application/xhtml+xml',
            'accept-language': 'vi,en;q=0.8',
            'accept-encoding': 'gzip, deflate, br',
          },
        },
        resolve,
      )
      req.on('timeout', () => req.destroy(new Error('timeout')))
      req.on('error', reject)
      req.end()
    })
  }

  return async function fetchPublicPage(rawUrl: string): Promise<{ html: string; finalUrl: string }> {
    let url: URL
    try {
      url = new URL(rawUrl.trim())
    } catch {
      throw new HttpError(400, 'Đường dẫn không hợp lệ. Hãy dán đầy đủ địa chỉ bắt đầu bằng https://')
    }

    const signal = AbortSignal.timeout(TOTAL_TIMEOUT_MS)

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      assertAllowedUrl(url)

      let response: http.IncomingMessage
      try {
        response = await request(url, signal)
      } catch (error) {
        const code = (error as { code?: string })?.code
        if (code === 'EBLOCKED') throw new HttpError(400, 'Đường dẫn này không được phép truy cập.')
        if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
          throw new HttpError(400, 'Không tìm thấy trang web này. Hãy kiểm tra lại đường dẫn.')
        }
        throw new HttpError(502, 'Không thể tải trang này. Trang có thể đang chặn truy cập tự động.')
      }

      const status = response.statusCode ?? 0
      if (status >= 300 && status < 400) {
        const location = response.headers.location
        response.resume()
        if (!location) break
        try {
          url = new URL(location, url)
        } catch {
          throw new HttpError(502, 'Trang web chuyển hướng tới địa chỉ không hợp lệ.')
        }
        continue
      }

      if (status < 200 || status >= 300) {
        response.resume()
        throw new HttpError(502, `Trang web trả về lỗi ${status}. Hãy thử đường dẫn khác.`)
      }

      const type = String(response.headers['content-type'] ?? '')
      if (!/text\/html|application\/xhtml|text\/plain/i.test(type)) {
        response.destroy()
        throw new HttpError(400, 'Đường dẫn này không phải trang bài viết. Nếu là tệp PDF, hãy tải tệp lên.')
      }

      try {
        const decoder = decoderFor(String(response.headers['content-encoding'] ?? ''))
        let body: Readable = response
        if (decoder) {
          const out = new PassThrough()
          // Lỗi giải nén/ngắt kết nối sau khi đã đủ dữ liệu là bình thường; chỉ cần dừng đọc.
          pipeline(response, decoder, out).catch(() => out.destroy())
          body = out
        }
        const buffer = await readCapped(body, MAX_BYTES)
        return { html: decodeBody(buffer, type), finalUrl: url.toString() }
      } catch (error) {
        if (error instanceof HttpError) throw error
        throw new HttpError(502, 'Không thể tải trang này. Trang có thể đang chặn truy cập tự động.')
      }
    }
    throw new HttpError(502, 'Trang web chuyển hướng quá nhiều lần.')
  }
}

export const fetchPublicPage = createPageFetcher()
