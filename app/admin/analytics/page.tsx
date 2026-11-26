import type { Metadata } from 'next'
import { getAdminAccess } from '@/lib/admin/session'
import { Dashboard } from './dashboard'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Thống kê học tập · Quản trị LabLuyen',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const access = await getAdminAccess()

  if (access === 'unconfigured') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h1 className="text-lg font-bold">Trang quản trị chưa được bật</h1>
          <p className="mt-2 text-sm leading-relaxed">
            Hãy đặt biến môi trường <code className="rounded bg-amber-100 px-1">ADMIN_ANALYTICS_SECRET</code> (chuỗi bí mật từ 12 ký tự trở lên) ở máy chủ rồi khởi động lại /
            triển khai lại.
          </p>
        </div>
      </main>
    )
  }

  return access === 'ok' ? <Dashboard /> : <LoginForm />
}
