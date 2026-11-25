import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client chạy Ở SERVER với Service Role Key (bỏ qua RLS).
 *
 * - Chỉ import file này từ route handler / code server. KHÔNG import vào code client
 *   và KHÔNG đặt khóa vào biến có tiền tố NEXT_PUBLIC_.
 * - Nếu thiếu (hoặc sai định dạng) biến môi trường, hàm trả về `null` thay vì ném lỗi,
 *   để ứng dụng vẫn chạy bình thường khi chưa cấu hình Supabase. Nơi gọi tự quyết định
 *   cách thoái lui (ví dụ: trả `{ ok: false, disabled: true }`).
 */

let cached: { signature: string; client: SupabaseClient } | null = null
let warned = false

function warnOnce(message: string) {
  if (warned) return
  warned = true
  console.warn(`[supabase] ${message}`)
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  // Chưa cấu hình, hoặc còn nguyên giá trị mẫu trong .env.example.
  if (!url || !key || /YOUR_/i.test(url) || /YOUR_/i.test(key)) return null

  const signature = `${url}|${key}`
  if (cached?.signature === signature) return cached.client

  try {
    if (!/^https?:\/\//i.test(url)) throw new Error('SUPABASE_URL phải bắt đầu bằng https://')
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'x-application-name': 'labluyen-server' } },
    })
    cached = { signature, client }
    return client
  } catch (error) {
    warnOnce(`Không tạo được client: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

export const isSupabaseConfigured = () => getSupabaseAdmin() !== null
