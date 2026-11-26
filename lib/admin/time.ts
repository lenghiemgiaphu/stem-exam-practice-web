/**
 * Ngày/giờ cho báo cáo: gom theo ngày theo múi giờ Việt Nam (UTC+7, không có giờ mùa hè)
 * để biểu đồ "theo ngày" khớp với ngày người học thực sự học.
 */
export const VN_OFFSET_MS = 7 * 3_600_000
export const DAY_MS = 86_400_000

/** 'YYYY-MM-DD' của một thời điểm theo giờ Việt Nam. */
export const dayKey = (ms: number) => new Date(ms + VN_OFFSET_MS).toISOString().slice(0, 10)

/** Thời điểm (ms, UTC) bắt đầu ngày 'YYYY-MM-DD' theo giờ Việt Nam. */
export const startOfDayMs = (key: string) => Date.parse(`${key}T00:00:00Z`) - VN_OFFSET_MS

/** Thời điểm (ms, UTC) kết thúc ngày 'YYYY-MM-DD' theo giờ Việt Nam. */
export const endOfDayMs = (key: string) => startOfDayMs(key) + DAY_MS - 1

export const addDaysKey = (key: string, days: number) => dayKey(startOfDayMs(key) + days * DAY_MS)

/** Danh sách ngày liên tiếp từ `fromMs` tới `toMs` (bao gồm cả hai đầu). */
export function eachDay(fromMs: number, toMs: number, limit = 400): string[] {
  const out: string[] = []
  let key = dayKey(fromMs)
  const last = dayKey(toMs)
  while (key <= last && out.length < limit) {
    out.push(key)
    key = addDaysKey(key, 1)
  }
  return out
}
