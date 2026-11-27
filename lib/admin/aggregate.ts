import { DAY_MS, addDaysKey, dayKey, eachDay } from '@/lib/admin/time'
import type {
  AccuracyRow,
  AdminFilters,
  AiStats,
  AttemptContext,
  LearningStats,
  OverviewStats,
  Retention,
  SrsStats,
} from '@/lib/admin/types'

/** Hàng dữ liệu thô đọc từ Supabase (chỉ các cột cần cho báo cáo). */
export interface SessionRow {
  id: string
  user_id: string
  subject: string | null
  topic_id: string | null
  session_type: string
  status: string
  total_questions: number
  answered_questions: number
  correct_count: number
  score: number | string | null
  drop_off_question_index: number | null
  started_at: string
  ended_at?: string | null
}
export interface ActivityRow {
  user_id: string
  started_at: string
}
export interface ProfileRow {
  user_id: string
  auth_provider: string
  referral_source: string | null
  first_seen_at: string
  last_seen_at?: string
}
export interface AttemptRow {
  user_id: string
  session_id: string | null
  question_id: string
  subject: string | null
  topic_id: string | null
  question_type?: string | null
  attempt_context: string
  is_correct: boolean
  is_first_try_in_session: boolean
  was_scheduled_on_time: boolean | null
  created_at: string
}
export interface SrsRow {
  user_id: string
  question_id: string
  subject: string | null
  topic_id: string | null
  interval_days: number
  ease_factor: number | string
  repetitions: number
  next_review_at: string
  last_reviewed_at: string | null
}
export interface AiRow {
  user_id: string
  session_id: string | null
  question_id: string | null
  subject: string | null
  topic_id: string | null
  question_type?: string | null
  model_name: string | null
  input_tokens: number
  output_tokens: number
  estimated_cost_usd: number | string
  feedback_rating: number | null
  is_requery: boolean
  latency_ms: number | null
  created_at: string
}

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
const ratio = (a: number, b: number) => (b > 0 ? a / b : null)
const round = (n: number | null, digits = 4) => (n == null ? null : Math.round(n * 10 ** digits) / 10 ** digits)
const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)
const UNKNOWN = '(không rõ)'

function groupBy<T>(rows: T[], keyOf: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const key = keyOf(row)
    const list = map.get(key)
    if (list) list.push(row)
    else map.set(key, [row])
  }
  return map
}

/* ------------------------------------------------------------------ Tổng quan người học */

export function aggregateOverview(input: {
  filters: AdminFilters
  nowMs: number
  totalUsers: number
  newProfiles: ProfileRow[]
  /** Mỗi phiên học = một sự kiện hoạt động; phải phủ từ (cuối khoảng − 29 ngày) đến hiện tại. */
  activity: ActivityRow[]
}): OverviewStats {
  const { filters, nowMs, totalUsers, newProfiles, activity } = input
  const fromMs = Date.parse(filters.from)
  const toMs = Date.parse(filters.to)
  const days = eachDay(fromMs, toMs)

  const newByDay = new Map(days.map((d) => [d, 0]))
  for (const p of newProfiles) {
    const key = dayKey(Date.parse(p.first_seen_at))
    if (newByDay.has(key)) newByDay.set(key, (newByDay.get(key) ?? 0) + 1)
  }

  const events = activity.map((a) => ({ user: a.user_id, ms: Date.parse(a.started_at) })).filter((e) => Number.isFinite(e.ms))
  const usersByDay = new Map<string, Set<string>>()
  const daysByUser = new Map<string, Set<string>>()
  for (const e of events) {
    const key = dayKey(e.ms)
    if (!usersByDay.has(key)) usersByDay.set(key, new Set())
    usersByDay.get(key)!.add(e.user)
    if (!daysByUser.has(e.user)) daysByUser.set(e.user, new Set())
    daysByUser.get(e.user)!.add(key)
  }

  const activeWithin = (windowDays: number) => {
    const users = new Set<string>()
    for (const e of events) if (e.ms > toMs - windowDays * DAY_MS && e.ms <= toMs) users.add(e.user)
    return users.size
  }

  const today = dayKey(nowMs)
  const retention = (afterDays: number): Retention => {
    let eligible = 0
    let retained = 0
    for (const p of newProfiles) {
      const target = addDaysKey(dayKey(Date.parse(p.first_seen_at)), afterDays)
      if (target > today) continue // chưa đủ ngày để đánh giá
      eligible++
      if (daysByUser.get(p.user_id)?.has(target)) retained++
    }
    return { eligible, retained, rate: round(ratio(retained, eligible)) }
  }

  const sources = [...groupBy(newProfiles, (p) => p.referral_source || UNKNOWN)]
    .map(([source, rows]) => ({ source, users: rows.length }))
    .sort((a, b) => b.users - a.users)
  const TOP = 15
  const referrals = sources.slice(0, TOP)
  const rest = sources.slice(TOP).reduce((sum, s) => sum + s.users, 0)
  if (rest) referrals.push({ source: 'khác', users: rest })

  return {
    totalUsers,
    newUsers: newProfiles.length,
    active: { dau: activeWithin(1), wau: activeWithin(7), mau: activeWithin(30) },
    dailyNewUsers: days.map((date) => ({ date, count: newByDay.get(date) ?? 0 })),
    dailyActiveUsers: days.map((date) => ({ date, count: usersByDay.get(date)?.size ?? 0 })),
    retention: { d1: retention(1), d7: retention(7) },
    referrals,
  }
}

/* ------------------------------------------------------------------ Hiệu quả học tập */

function accuracyOf(rows: AttemptRow[]): AccuracyRow {
  let correct = 0
  let firstTry = 0
  let firstTryCorrect = 0
  for (const r of rows) {
    if (r.is_correct) correct++
    if (r.is_first_try_in_session) {
      firstTry++
      if (r.is_correct) firstTryCorrect++
    }
  }
  return {
    attempts: rows.length,
    correct,
    accuracy: round(ratio(correct, rows.length)),
    firstTryAttempts: firstTry,
    firstTryCorrect,
    firstTryAccuracy: round(ratio(firstTryCorrect, firstTry)),
  }
}

export const DROP_OFF_CAP = 30
const CONTEXTS: AttemptContext[] = ['initial', 'retest', 'spaced_review']

export function aggregateLearning(sessions: SessionRow[], attempts: AttemptRow[]): LearningStats {
  const completed = sessions.filter((s) => s.status === 'completed')
  const abandoned = sessions.filter((s) => s.status === 'abandoned')
  const total = sessions.length

  const scores = completed.filter((s) => s.score != null).map((s) => num(s.score))
  const answeredSum = completed.reduce((a, s) => a + s.answered_questions, 0)
  const correctSum = completed.reduce((a, s) => a + s.correct_count, 0)

  const dropCounts = new Map<number, number>()
  let dropUnknown = 0
  for (const s of abandoned) {
    if (s.drop_off_question_index == null) {
      dropUnknown++
      continue
    }
    const position = Math.min(s.drop_off_question_index + 1, DROP_OFF_CAP)
    dropCounts.set(position, (dropCounts.get(position) ?? 0) + 1)
  }
  const maxPosition = Math.max(0, ...dropCounts.keys())
  const dropOff = Array.from({ length: maxPosition }, (_, i) => ({ position: i + 1, count: dropCounts.get(i + 1) ?? 0 }))

  const byContext = CONTEXTS.map((context) => ({
    context,
    ...accuracyOf(attempts.filter((a) => a.attempt_context === context)),
  }))

  const attemptsBySubject = groupBy(attempts, (a) => a.subject || UNKNOWN)
  const sessionsBySubject = groupBy(sessions, (s) => s.subject || UNKNOWN)
  const subjects = new Set([...attemptsBySubject.keys(), ...sessionsBySubject.keys()])
  const bySubject = [...subjects]
    .map((subject) => {
      const ss = sessionsBySubject.get(subject) ?? []
      const done = ss.filter((s) => s.status === 'completed')
      const sc = done.filter((s) => s.score != null).map((s) => num(s.score))
      return {
        subject,
        ...accuracyOf(attemptsBySubject.get(subject) ?? []),
        sessions: ss.length,
        completedSessions: done.length,
        avgScore: round(mean(sc), 2),
      }
    })
    .sort((a, b) => b.attempts - a.attempts || b.sessions - a.sessions)

  const byTopic = [...groupBy(attempts, (a) => a.topic_id || UNKNOWN)]
    .map(([topicId, rows]) => ({ topicId, subject: rows.find((r) => r.subject)?.subject ?? null, ...accuracyOf(rows) }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 20)

  return {
    sessions: {
      total,
      completed: completed.length,
      abandoned: abandoned.length,
      inProgress: sessions.filter((s) => s.status === 'active').length,
      completionRate: round(ratio(completed.length, total)),
      abandonRate: round(ratio(abandoned.length, total)),
    },
    avgScore: round(mean(scores), 2),
    avgAccuracy: round(ratio(correctSum, answeredSum)),
    dropOff,
    dropOffUnknown: dropUnknown,
    byContext,
    bySubject,
    byTopic,
  }
}

/* ------------------------------------------------------------------ Ôn ngắt quãng (SM-2) */

const INTERVAL_BUCKETS: [string, (d: number) => boolean][] = [
  ['0', (d) => d <= 0],
  ['1', (d) => d === 1],
  ['2–3', (d) => d >= 2 && d <= 3],
  ['4–7', (d) => d >= 4 && d <= 7],
  ['8–14', (d) => d >= 8 && d <= 14],
  ['15–30', (d) => d >= 15 && d <= 30],
  ['31–60', (d) => d >= 31 && d <= 60],
  ['61+', (d) => d >= 61],
]

export function aggregateSrs(input: { filters: AdminFilters; nowMs: number; items: SrsRow[]; attempts: AttemptRow[] }): SrsStats {
  const { filters, nowMs, items, attempts } = input
  const fromMs = Date.parse(filters.from)
  const toMs = Date.parse(filters.to)

  const dueNow = items.filter((i) => Date.parse(i.next_review_at) <= nowMs).length
  const overdue7d = items.filter((i) => Date.parse(i.next_review_at) <= nowMs - 7 * DAY_MS).length
  const reviewedItems = items.filter((i) => {
    const t = i.last_reviewed_at ? Date.parse(i.last_reviewed_at) : NaN
    return t >= fromMs && t <= toMs
  }).length

  const reviews = attempts.filter((a) => a.attempt_context === 'spaced_review' && a.is_first_try_in_session)
  const scheduled = attempts.filter((a) => a.was_scheduled_on_time != null)
  const scheduledReviews = reviews.filter((a) => a.was_scheduled_on_time != null)
  const onTime = (rows: AttemptRow[]) => {
    const hit = rows.filter((r) => r.was_scheduled_on_time === true).length
    return { total: rows.length, onTime: hit, rate: round(ratio(hit, rows.length)) }
  }

  return {
    itemsTracked: items.length,
    dueNow,
    overdue7d,
    reviewedItemsInWindow: reviewedItems,
    reviewAttempts: reviews.length,
    reviewCorrectRate: round(ratio(reviews.filter((r) => r.is_correct).length, reviews.length)),
    onTime: onTime(scheduled),
    onTimeSpacedReview: onTime(scheduledReviews),
    intervalDistribution: INTERVAL_BUCKETS.map(([bucket, test]) => ({ bucket, count: items.filter((i) => test(num(i.interval_days))).length })),
    avgEaseFactor: round(mean(items.map((i) => num(i.ease_factor))), 2),
    avgRepetitions: round(mean(items.map((i) => num(i.repetitions))), 2),
  }
}

/* ------------------------------------------------------------------ Gia sư AI & chi phí */

export function aggregateAi(rows: AiRow[], filters: AdminFilters): AiStats {
  const total = rows.length
  const inputTokens = rows.reduce((a, r) => a + num(r.input_tokens), 0)
  const outputTokens = rows.reduce((a, r) => a + num(r.output_tokens), 0)
  const cost = rows.reduce((a, r) => a + num(r.estimated_cost_usd), 0)
  const up = rows.filter((r) => r.feedback_rating === 1).length
  const down = rows.filter((r) => r.feedback_rating === -1).length
  const requery = rows.filter((r) => r.is_requery).length
  const latencies = rows.filter((r) => r.latency_ms != null).map((r) => num(r.latency_ms)).sort((a, b) => a - b)
  const p95 = latencies.length ? latencies[Math.max(0, Math.ceil(0.95 * latencies.length) - 1)] : null

  const byModel = [...groupBy(rows, (r) => r.model_name || UNKNOWN)]
    .map(([model, list]) => ({
      model,
      count: list.length,
      inputTokens: list.reduce((a, r) => a + num(r.input_tokens), 0),
      outputTokens: list.reduce((a, r) => a + num(r.output_tokens), 0),
      costUsd: round(list.reduce((a, r) => a + num(r.estimated_cost_usd), 0), 6) ?? 0,
    }))
    .sort((a, b) => b.count - a.count)

  const byDay = groupBy(rows, (r) => dayKey(Date.parse(r.created_at)))
  const daily = eachDay(Date.parse(filters.from), Date.parse(filters.to)).map((date) => {
    const list = byDay.get(date) ?? []
    return { date, count: list.length, costUsd: round(list.reduce((a, r) => a + num(r.estimated_cost_usd), 0), 6) ?? 0 }
  })

  return {
    totalInteractions: total,
    inputTokens,
    outputTokens,
    totalCostUsd: round(cost, 6) ?? 0,
    avgCostUsd: round(total ? cost / total : null, 6),
    helpfulness: { up, down, rated: up + down, rate: round(ratio(up, up + down)), coverage: round(ratio(up + down, total)) },
    requeryRate: round(ratio(requery, total)),
    requeryCount: requery,
    avgLatencyMs: round(mean(latencies), 0),
    p95LatencyMs: p95,
    byModel,
    daily,
  }
}
