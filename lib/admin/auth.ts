import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { HttpError } from '@/lib/quiz/errors'

/**
 * Xác thực trang quản trị bằng ADMIN_ANALYTICS_SECRET.
 *  - Người quản trị nhập mã vào form; server so sánh trong thời gian hằng số.
 *  - Thành công → cookie HTTP-only chứa token ký HMAC (hết hạn + chữ ký). Bản thân mã bí mật
 *    KHÔNG BAO GIỜ được gửi xuống trình duyệt, kể cả trong cookie.
 *  - Đổi ADMIN_ANALYTICS_SECRET sẽ vô hiệu hóa mọi phiên đăng nhập đang có.
 * Chỉ import file này ở code server.
 */
export const ADMIN_COOKIE = 'labluyen_admin'
export const SESSION_TTL_MS = 8 * 3_600_000
const MIN_SECRET_LENGTH = 12

/** Trả về mã bí mật hợp lệ, hoặc null nếu chưa cấu hình (thiếu / còn giá trị mẫu / quá ngắn). */
export function adminSecret(): string | null {
  const value = process.env.ADMIN_ANALYTICS_SECRET?.trim()
  if (!value || value.length < MIN_SECRET_LENGTH || /CHANGE_ME|YOUR_/i.test(value)) return null
  return value
}

const digest = (value: string) => createHash('sha256').update(value).digest()
const sign = (secret: string, payload: string) => createHmac('sha256', secret).update(payload).digest('hex')

/** So sánh mã người dùng nhập với secret (băm trước để độ dài không lộ ra qua thời gian xử lý). */
export function checkAdminCode(input: string): boolean {
  const secret = adminSecret()
  if (!secret || typeof input !== 'string' || !input) return false
  return timingSafeEqual(digest(input), digest(secret))
}

export function createSessionToken(now = Date.now()): string {
  const secret = adminSecret()
  if (!secret) throw new HttpError(503, 'Chưa cấu hình ADMIN_ANALYTICS_SECRET.')
  const expires = now + SESSION_TTL_MS
  return `${expires}.${sign(secret, `admin-session:${expires}`)}`
}

export function verifySessionToken(token: string | null | undefined, now = Date.now()): boolean {
  const secret = adminSecret()
  if (!secret || !token) return false
  const [expiresRaw, signature, ...rest] = token.split('.')
  if (rest.length || !expiresRaw || !signature || !/^\d{10,16}$/.test(expiresRaw) || !/^[0-9a-f]{64}$/.test(signature)) return false
  const expires = Number(expiresRaw)
  if (!Number.isFinite(expires) || expires <= now) return false
  const expected = Buffer.from(sign(secret, `admin-session:${expires}`), 'hex')
  const given = Buffer.from(signature, 'hex')
  return expected.length === given.length && timingSafeEqual(expected, given)
}

const secureFlag = () => (process.env.NODE_ENV === 'production' ? '; Secure' : '')

export const sessionCookieHeader = (token: string) =>
  `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secureFlag()}`

export const clearCookieHeader = () => `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureFlag()}`

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    const at = part.indexOf('=')
    if (at > 0 && part.slice(0, at).trim() === name) return part.slice(at + 1).trim()
  }
  return null
}

export const isAdminRequest = (req: Request) => verifySessionToken(readCookie(req.headers.get('cookie'), ADMIN_COOKIE))

/** Dùng ở đầu mọi API đọc số liệu quản trị. */
export function requireAdmin(req: Request) {
  if (!isAdminRequest(req)) throw new HttpError(401, 'Chưa đăng nhập quản trị hoặc phiên đã hết hạn.')
}

/** Ẩn danh hóa user_id khi xuất dữ liệu chi tiết: băm một chiều có khóa (khóa = secret quản trị). */
export function anonymizeUserId(userId: string): string {
  const secret = adminSecret() ?? 'unconfigured'
  return `u_${createHmac('sha256', secret).update(`uid:${userId}`).digest('hex').slice(0, 16)}`
}
