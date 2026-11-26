import { cookies } from 'next/headers'
import { ADMIN_COOKIE, adminSecret, verifySessionToken } from '@/lib/admin/auth'

/** Trạng thái truy cập của trang /admin/analytics (dùng trong Server Component). */
export async function getAdminAccess(): Promise<'unconfigured' | 'login' | 'ok'> {
  if (!adminSecret()) return 'unconfigured'
  const jar = await cookies()
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value) ? 'ok' : 'login'
}
