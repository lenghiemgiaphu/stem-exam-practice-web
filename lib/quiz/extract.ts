import JSZip from 'jszip'
import { HttpError } from './errors'

const XML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
}

export function decodeEntities(input: string): string {
  return input
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (m) => XML_ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => safeFromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => safeFromCodePoint(parseInt(n, 16)))
}

function safeFromCodePoint(code: number): string {
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

/** Chuẩn hóa văn bản: bỏ ký tự điều khiển/độ rộng bằng 0, gộp khoảng trắng, tối đa một dòng trống liên tiếp. */
export function tidyText(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000e-\u001f\u007f\u200b\u2060\ufeff]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v\u00a0\u2000-\u200a\u202f\u205f\u3000]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Gỡ thẻ `<...>` bằng một lượt quét tuyến tính (chỉ dùng indexOf).
 * Không dùng regex kiểu `<[^>]+>` vì chuỗi do người dùng đưa vào (tệp tải lên, trang web) có thể là hàng triệu
 * ký tự `<` không có `>` — khi đó regex chạy O(n²) và làm treo máy chủ.
 */
function stripTags(input: string, onTag?: (tag: string) => string): string {
  const out: string[] = []
  let i = 0
  while (i < input.length) {
    const lt = input.indexOf('<', i)
    if (lt === -1) {
      out.push(input.slice(i))
      break
    }
    out.push(input.slice(i, lt))
    const gt = input.indexOf('>', lt + 1)
    if (gt === -1) break // thẻ dang dở ở cuối: bỏ phần còn lại
    if (onTag) out.push(onTag(input.slice(lt, gt + 1)))
    i = gt + 1
  }
  return out.join('')
}

/** Giới hạn dung lượng SAU khi giải nén để chống "zip bomb" (tệp nén 4 MB có thể phình ra hàng GB). */
const MAX_ENTRY_BYTES = 12 * 1024 * 1024
const MAX_TOTAL_BYTES = 32 * 1024 * 1024
const MAX_SLIDES = 400

function tooLarge(): never {
  throw new HttpError(413, 'Nội dung bên trong tệp quá lớn để xử lý. Hãy dùng tệp nhỏ hơn hoặc cắt bớt trang.')
}

async function readEntry(zip: JSZip, path: string, budget: { left: number }): Promise<string | null> {
  const entry = zip.file(path)
  if (!entry) return null
  const cap = Math.min(MAX_ENTRY_BYTES, budget.left)
  if (cap <= 0) tooLarge()

  return new Promise<string>((resolve, reject) => {
    const stream = entry.nodeStream('nodebuffer')
    const chunks: Buffer[] = []
    let total = 0
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      stream.pause()
      reject(error)
    }
    stream.on('data', (chunk: Buffer) => {
      total += chunk.length
      if (total > cap) return fail(new HttpError(413, 'Nội dung bên trong tệp quá lớn để xử lý. Hãy dùng tệp nhỏ hơn hoặc cắt bớt trang.'))
      chunks.push(chunk)
    })
    stream.on('end', () => {
      if (settled) return
      settled = true
      budget.left -= total
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    stream.on('error', fail)
  })
}

type BinaryInput = ArrayBuffer | Uint8Array

export async function extractDocx(buffer: BinaryInput): Promise<string> {
  const zip = await JSZip.loadAsync(buffer).catch(() => {
    throw new HttpError(400, 'Không đọc được tệp Word. Hãy chắc chắn đây là tệp .docx hợp lệ.')
  })
  const xml = await readEntry(zip, 'word/document.xml', { left: MAX_TOTAL_BYTES })
  if (!xml) throw new HttpError(400, 'Tệp Word không có nội dung văn bản.')

  const text = stripTags(xml, (tag) => {
    if (tag === '</w:p>') return '\n'
    if (/^<w:tab\s*\/>$/.test(tag)) return '\t'
    if (/^<w:br\s*\/>$/.test(tag)) return '\n'
    return ''
  })
  return tidyText(decodeEntities(text))
}

export async function extractPptx(buffer: BinaryInput): Promise<string> {
  const zip = await JSZip.loadAsync(buffer).catch(() => {
    throw new HttpError(400, 'Không đọc được tệp PowerPoint. Hãy chắc chắn đây là tệp .pptx hợp lệ.')
  })

  const slideNumber = (path: string) => Number(path.match(/(\d+)\.xml$/)?.[1] ?? 0)
  const paths = (pattern: RegExp) =>
    Object.keys(zip.files)
      .filter((p) => pattern.test(p))
      .sort((a, b) => slideNumber(a) - slideNumber(b))

  const toText = (xml: string) =>
    tidyText(
      decodeEntities(
        stripTags(xml, (tag) => {
          if (tag === '</a:p>') return '\n'
          if (/^<a:br\s*\/>$/.test(tag)) return '\n'
          return ''
        }),
      ),
    )

  const slidePaths = paths(/^ppt\/slides\/slide\d+\.xml$/).slice(0, MAX_SLIDES)
  const budget = { left: MAX_TOTAL_BYTES }

  const notes = new Map<number, string>()
  for (const path of paths(/^ppt\/notesSlides\/notesSlide\d+\.xml$/).slice(0, MAX_SLIDES)) {
    const xml = await readEntry(zip, path, budget)
    if (xml) notes.set(slideNumber(path), toText(xml))
  }

  const blocks: string[] = []
  for (const path of slidePaths) {
    const xml = await readEntry(zip, path, budget)
    if (!xml) continue
    const n = slideNumber(path)
    const body = toText(xml)
    const note = notes.get(n)
    blocks.push(`--- Slide ${n} ---\n${body}${note ? `\nGhi chú của người trình bày: ${note}` : ''}`)
  }
  return blocks.join('\n\n')
}

/* ---------------------------------------------------------------------------
 * Trích bài báo từ HTML — một lượt quét tuyến tính, an toàn với HTML độc hại
 * (hàng triệu thẻ không đóng). Mỗi tên thẻ chỉ bị tìm thẻ đóng thất bại tối đa MỘT lần.
 * ------------------------------------------------------------------------- */

const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'svg', 'iframe', 'form', 'nav', 'header', 'footer', 'aside', 'template'])
const BLOCK_TAGS = new Set([
  'p', 'div', 'section', 'article', 'main', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol', 'tr', 'table', 'blockquote', 'br', 'figcaption', 'pre', 'dd', 'dt',
])
const REGION_TAGS = new Set(['article', 'main'])
const MAX_ATTR_TAG_CHARS = 2048

type HtmlEvent = string | { open: string } | { close: string }

const asciiLower = (s: string) => s.replace(/[A-Z]+/g, (m) => m.toLowerCase()) // giữ nguyên độ dài chuỗi

function attrOf(tag: string, name: string): string | null {
  if (tag.length > MAX_ATTR_TAG_CHARS) return null
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  const m = re.exec(tag)
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : null
}

function scanHtml(html: string) {
  const lower = asciiLower(html)
  const n = html.length
  const events: HtmlEvent[] = []
  const noClose = new Set<string>()
  let ogTitle = ''
  let docTitle = ''
  let titleSearched = false // chỉ tìm </title> đúng một lần, tránh O(n²) khi có hàng loạt <title> không đóng
  let i = 0

  const findClose = (name: string, from: number): { end: number; next: number } | null => {
    const needle = `</${name}`
    let at = lower.indexOf(needle, from)
    while (at !== -1) {
      const after = lower.charCodeAt(at + needle.length)
      const isNameChar = (after >= 97 && after <= 122) || (after >= 48 && after <= 57) || after === 45 // a-z 0-9 -
      if (!isNameChar) {
        const gt = html.indexOf('>', at)
        return { end: at, next: gt === -1 ? n : gt + 1 }
      }
      at = lower.indexOf(needle, at + needle.length)
    }
    return null
  }

  while (i < n) {
    const lt = html.indexOf('<', i)
    if (lt === -1) {
      events.push(html.slice(i))
      break
    }
    if (lt > i) events.push(html.slice(i, lt))

    if (lower.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4)
      i = end === -1 ? n : end + 3
      continue
    }

    const m = /^<(\/?)([a-z][a-z0-9-]*)/.exec(lower.slice(lt, lt + 40))
    if (!m) {
      // `<` đứng riêng (ví dụ "a < b") hoặc <!DOCTYPE>, <?xml ...>
      if (lower.startsWith('<!', lt) || lower.startsWith('<?', lt)) {
        const gt = html.indexOf('>', lt)
        i = gt === -1 ? n : gt + 1
      } else {
        events.push('<')
        i = lt + 1
      }
      continue
    }

    const closing = m[1] === '/'
    const name = m[2]
    const gt = html.indexOf('>', lt)
    if (gt === -1) break
    const tag = html.slice(lt, gt + 1)
    i = gt + 1

    if (closing) {
      if (REGION_TAGS.has(name)) events.push({ close: name })
      if (BLOCK_TAGS.has(name)) events.push('\n')
      continue
    }

    if (name === 'meta' && !ogTitle && attrOf(tag, 'property')?.toLowerCase() === 'og:title') {
      ogTitle = attrOf(tag, 'content') ?? ''
      continue
    }

    if (name === 'title' && !titleSearched) {
      titleSearched = true
      const close = findClose('title', i)
      if (close) {
        docTitle = html.slice(i, close.end)
        i = close.next
      }
      continue
    }

    const selfClosed = html.charCodeAt(gt - 1) === 47 // "/>"
    if (SKIP_TAGS.has(name) && !selfClosed && !noClose.has(name)) {
      const close = findClose(name, i)
      if (close) i = close.next
      else noClose.add(name)
      continue
    }

    if (REGION_TAGS.has(name)) events.push({ open: name })
    if (BLOCK_TAGS.has(name)) events.push('\n')
  }

  return { events, title: ogTitle || docTitle }
}

/** Gom các đoạn văn bản nằm trong từng cặp <region>…</region> (không lồng nhau tính theo cùng tên). */
function regionTexts(events: HtmlEvent[], region: string): string[] {
  const found: string[] = []
  let depth = 0
  let buffer: string[] = []
  for (const e of events) {
    if (typeof e === 'string') {
      if (depth > 0) buffer.push(e)
    } else if ('open' in e && e.open === region) {
      if (depth === 0) buffer = []
      depth++
    } else if ('close' in e && e.close === region && depth > 0) {
      depth--
      if (depth === 0) found.push(buffer.join(''))
    }
  }
  if (depth > 0) found.push(buffer.join('')) // thẻ mở mà không đóng: lấy đến hết trang
  return found
}

export function extractHtmlArticle(html: string): { title: string; text: string } {
  const { events, title } = scanHtml(html)
  // Mỗi khối (đoạn, tiêu đề, mục danh sách…) một dòng: gộp các dòng trống do thẻ mở + thẻ đóng sinh ra.
  const clean = (raw: string) => tidyText(decodeEntities(raw)).replace(/\n{2,}/g, '\n')

  // Ưu tiên <article> (chọn khối có nhiều chữ nhất, tránh nhầm với "bài liên quan"), rồi <main>, cuối cùng cả trang.
  for (const region of ['article', 'main']) {
    const best = regionTexts(events, region)
      .map(clean)
      .sort((a, b) => b.length - a.length)[0]
    if (best) return { title: clean(title), text: best }
  }
  return { title: clean(title), text: clean(events.filter((e): e is string => typeof e === 'string').join('')) }
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'])

export function parseYoutubeUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim())
    if (!['http:', 'https:'].includes(url.protocol) || !YOUTUBE_HOSTS.has(url.hostname)) return null
    const id =
      url.hostname === 'youtu.be'
        ? url.pathname.slice(1)
        : url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')
          ? url.pathname.split('/')[2]
          : url.searchParams.get('v')
    if (!id || !/^[\w-]{6,20}$/.test(id)) return null
    return new URL(`https://www.youtube.com/watch?v=${id}`)
  } catch {
    return null
  }
}
