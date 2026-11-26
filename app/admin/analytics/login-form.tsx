'use client'

import { useState, type FormEvent } from 'react'

export function LoginForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || !code) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/analytics/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (response.ok && data?.ok) {
        window.location.reload() // cookie HTTP-only đã được đặt; server sẽ render dashboard
        return
      }
      setError(data?.error || 'Không đăng nhập được. Vui lòng thử lại.')
    } catch {
      setError('Không kết nối được máy chủ. Vui lòng thử lại.')
    } finally {
      setBusy(false)
      setCode('')
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center px-4">
      <form onSubmit={submit} className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900">Quản trị thống kê</h1>
        <p className="mt-1 text-sm text-slate-600">Nhập mã quản trị để xem số liệu học tập của LabLuyen.</p>
        <label htmlFor="admin-code" className="mt-5 block text-sm font-semibold text-slate-700">
          Mã quản trị
        </label>
        <input
          id="admin-code"
          type="password"
          autoComplete="off"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !code}
          className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? 'Đang kiểm tra…' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  )
}
