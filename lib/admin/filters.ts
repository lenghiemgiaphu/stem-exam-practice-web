import { z } from 'zod'
import { HttpError } from '@/lib/quiz/errors'
import { DAY_MS, addDaysKey, dayKey, endOfDayMs, startOfDayMs } from '@/lib/admin/time'
import type { AdminFilters } from '@/lib/admin/types'

const MAX_RANGE_DAYS = 366
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null))

const querySchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'custom']).default('30d'),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  subject: text(32),
  topicId: text(128),
  sessionType: z
    .enum(['exam', 'topic_practice', 'spaced_review', ''])
    .optional()
    .transform((v) => v || null),
  authType: z
    .enum(['firebase', 'anonymous', ''])
    .optional()
    .transform((v) => v || null),
})

/** Đọc & kiểm tra bộ lọc toàn trang từ query string. Khoảng thời gian tính theo ngày giờ Việt Nam. */
export function parseFilters(params: URLSearchParams, now = Date.now()): AdminFilters {
  const q = querySchema.parse(Object.fromEntries(params))
  let fromMs: number
  let toMs: number

  if (q.range === 'custom') {
    if (!q.from || !q.to) throw new HttpError(400, 'Khoảng tùy chọn cần cả ngày bắt đầu và ngày kết thúc.')
    fromMs = startOfDayMs(q.from)
    toMs = Math.min(endOfDayMs(q.to), now)
    if (Number.isNaN(fromMs) || Number.isNaN(toMs) || fromMs > toMs) throw new HttpError(400, 'Khoảng thời gian không hợp lệ.')
    if ((toMs - fromMs) / DAY_MS > MAX_RANGE_DAYS) throw new HttpError(400, `Khoảng thời gian tối đa ${MAX_RANGE_DAYS} ngày.`)
  } else {
    const days = q.range === '7d' ? 7 : q.range === '90d' ? 90 : 30
    // N ngày gần nhất tính cả hôm nay: bắt đầu từ 00:00 (giờ VN) của (hôm nay − (N−1)) ngày.
    fromMs = startOfDayMs(addDaysKey(dayKey(now), -(days - 1)))
    toMs = now
  }

  return {
    range: q.range,
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    subject: q.subject,
    topicId: q.topicId,
    sessionType: q.sessionType,
    authType: q.authType,
  }
}
