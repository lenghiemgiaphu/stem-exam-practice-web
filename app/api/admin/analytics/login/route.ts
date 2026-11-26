import { z } from 'zod'
import { adminSecret, checkAdminCode, createSessionToken, sessionCookieHeader } from '@/lib/admin/auth'
import { assertSameOrigin, failure, json, readJson } from '@/lib/analytics/http'
import { enforceRateLimit } from '@/lib/analytics/rate-limit'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({ code: z.string().min(1).max(256) })

/**
 * POST /api/admin/analytics/login  { code }
 * So khớp mã quản trị với ADMIN_ANALYTICS_SECRET rồi cấp cookie HTTP-only (đã ký, hết hạn sau 8 giờ).
 * Mã bí mật không bao giờ được trả về trình duyệt.
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    enforceRateLimit(req, 'admin-login', undefined, { ip: 8 }) // chống dò mã: 8 lần/phút/IP
    const { code } = bodySchema.parse(await readJson(req, 2 * 1024))

    if (!adminSecret()) {
      return json({ ok: false, error: 'Chưa cấu hình ADMIN_ANALYTICS_SECRET (cần tối thiểu 12 ký tự) ở máy chủ.' }, 503)
    }
    if (!checkAdminCode(code)) {
      await new Promise((resolve) => setTimeout(resolve, 400)) // làm chậm các lần thử sai
      return json({ ok: false, error: 'Mã quản trị không đúng.' }, 401)
    }
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookieHeader(createSessionToken()) })
  } catch (error) {
    return failure('admin/login', error)
  }
}
