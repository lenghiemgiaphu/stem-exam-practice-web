import { HttpError } from '@/lib/quiz/errors'
import { clientIp } from '@/lib/analytics/http'

/**
 * Giới hạn tần suất dạng cửa sổ trượt, lưu TRONG BỘ NHỚ (mỗi instance serverless một bản,
 * reset khi cold start) — cùng mức "best-effort" với limiter của /api/generate-quiz.
 * Cần giới hạn nghiêm ngặt hơn thì chuyển sang Upstash (`@upstash/ratelimit`, đã có trong dự án).
 *
 * Lưu ý: nhiều học sinh trong cùng một trường thường chung một IP công cộng, nên hạn mức theo IP
 * được đặt rộng; hạn mức theo user chặt hơn.
 */
const hits = new Map<string, number[]>()
let lastSweep = 0

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, list] of hits) {
    if (!list.length || now - list[list.length - 1] > windowMs) hits.delete(key)
  }
}

function take(key: string, limit: number, windowMs: number, now: number) {
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  list.push(now)
  hits.set(key, list)
  return list.length <= limit
}

interface Limits {
  /** Số request tối đa / phút cho mỗi IP. */
  ip: number
  /** Số request tối đa / phút cho mỗi user_id (bỏ qua nếu không truyền userId). */
  user?: number
}

export function enforceRateLimit(req: Request, scope: string, userId: string | undefined, limits: Limits) {
  const windowMs = 60_000
  const now = Date.now()
  sweep(now, windowMs)
  const okIp = take(`${scope}:ip:${clientIp(req)}`, limits.ip, windowMs, now)
  const okUser = !userId || !limits.user || take(`${scope}:user:${userId}`, limits.user, windowMs, now)
  if (!okIp || !okUser) throw new HttpError(429, 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.')
}
