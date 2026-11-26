import { clearCookieHeader } from '@/lib/admin/auth'
import { assertSameOrigin, failure, json } from '@/lib/analytics/http'

export const dynamic = 'force-dynamic'

/** POST /api/admin/analytics/logout — xóa cookie quản trị. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    return json({ ok: true }, 200, { 'Set-Cookie': clearCookieHeader() })
  } catch (error) {
    return failure('admin/logout', error)
  }
}
