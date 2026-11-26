import { NextResponse } from 'next/server'
import { z } from 'zod'
import { HttpError } from '@/lib/quiz/errors'

export const NO_STORE = { 'Cache-Control': 'no-store' } as const

/**
 * Phản hồi khi chưa cấu hình Supabase. Dùng HTTP 200 (không phải 5xx) để môi trường local
 * chưa có Supabase không in lỗi đỏ trong console; client đọc `disabled` rồi tự ngừng gọi.
 */
export function disabledResponse(extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, disabled: true, ...extra }, { headers: NO_STORE })
}

export function json(body: Record<string, unknown>, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } })
}

/** Đọc JSON an toàn: hỗ trợ cả `navigator.sendBeacon` (Content-Type có thể là text/plain). */
export async function readJson(req: Request, maxBytes = 64 * 1024): Promise<unknown> {
  const declared = Number(req.headers.get('content-length') ?? 0)
  if (declared > maxBytes) throw new HttpError(413, 'Dữ liệu gửi lên quá lớn.')
  const raw = await req.text()
  if (raw.length > maxBytes) throw new HttpError(413, 'Dữ liệu gửi lên quá lớn.')
  try {
    return JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'Dữ liệu gửi lên không phải JSON hợp lệ.')
  }
}

export function clientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Chặn các trang web KHÁC gọi API này từ trình duyệt của người dùng (ví dụ lợi dụng /api/ai-explain
 * để tiêu tốn hạn mức Gemini). Request không có header Origin (curl, server-to-server) vẫn qua —
 * đây là lớp giảm thiểu lạm dụng, không phải cơ chế xác thực.
 */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin')
  if (!origin) return
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  let originHost = ''
  try {
    originHost = new URL(origin).host
  } catch {
    throw new HttpError(403, 'Nguồn gửi yêu cầu không hợp lệ.')
  }
  if (host && originHost !== host) throw new HttpError(403, 'Nguồn gửi yêu cầu không hợp lệ.')
}

/** Chuẩn hóa lỗi của route: HttpError / ZodError / lỗi không lường trước. */
export function failure(scope: string, error: unknown) {
  if (error instanceof HttpError) return json({ ok: false, error: error.message }, error.status)
  if (error instanceof z.ZodError) return json({ ok: false, error: 'Dữ liệu gửi lên không hợp lệ.' }, 400)
  console.error(`[${scope}] unexpected error`, error)
  return json({ ok: false, error: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại.' }, 500)
}

/** Lỗi từ Supabase/PostgREST → ghi log đầy đủ ở server, chỉ trả thông báo chung cho client. */
export function dbError(scope: string, error: { message?: string; code?: string } | null | undefined): HttpError {
  console.error(`[${scope}] database error`, error?.code, error?.message)
  return new HttpError(500, 'Không thể lưu dữ liệu thống kê lúc này.')
}
