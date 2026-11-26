import type { SupabaseClient } from '@supabase/supabase-js'
import { HttpError } from '@/lib/quiz/errors'
import {
  aggregateAi,
  aggregateLearning,
  aggregateOverview,
  aggregateSrs,
  type ActivityRow,
  type AiRow,
  type AttemptRow,
  type ProfileRow,
  type SessionRow,
  type SrsRow,
} from '@/lib/admin/aggregate'
import { DAY_MS } from '@/lib/admin/time'
import type { AdminFacets, AdminFilters, AdminSummary } from '@/lib/admin/types'

/**
 * Tải dữ liệu từ Supabase (CHỈ chạy ở server, bằng Service Role Key) rồi tổng hợp.
 * Mỗi nhóm dữ liệu được phân trang song song và giới hạn MAX_ROWS hàng; nếu chạm giới hạn,
 * tên nhóm được đưa vào `truncated` để dashboard cảnh báo số liệu có thể chưa đầy đủ.
 */
const PAGE_SIZE = 1000
export const MAX_ROWS = 50_000
const PARALLEL_PAGES = 6

// Builder của supabase-js có kiểu rất phức tạp; các hàm lọc bên dưới chỉ dùng vài phương thức chung nên dùng `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any

export interface Loaded<T> {
  rows: T[]
  truncated: boolean
}

type PageResult = { data: unknown[] | null; error: { message?: string; code?: string } | null }

async function fetchAll<T>(scope: string, page: (from: number, to: number) => PromiseLike<PageResult>, maxRows = MAX_ROWS): Promise<Loaded<T>> {
  const rows: T[] = []
  let offset = 0
  while (offset < maxRows) {
    const starts = Array.from({ length: PARALLEL_PAGES }, (_, i) => offset + i * PAGE_SIZE).filter((o) => o < maxRows)
    const results = await Promise.all(starts.map((o) => page(o, o + PAGE_SIZE - 1)))
    let finished = false
    for (const r of results) {
      if (r.error) {
        console.error(`[admin/stats] ${scope}`, r.error.code, r.error.message)
        throw new HttpError(500, 'Không đọc được dữ liệu thống kê.')
      }
      const data = (r.data ?? []) as T[]
      rows.push(...data)
      if (data.length < PAGE_SIZE) finished = true
    }
    if (finished) return { rows, truncated: false }
    offset += PARALLEL_PAGES * PAGE_SIZE
  }
  return { rows, truncated: true }
}

const isAnon = (id: string) => id.startsWith('anon_')
const authOk = (f: AdminFilters, id: string) => !f.authType || (f.authType === 'anonymous') === isAnon(id)

/** Lọc theo loại người dùng ở phía DB (theo tiền tố user_id), sau đó lọc chính xác lại ở JS. */
function scopeAuth(q: AnyQuery, f: AdminFilters): AnyQuery {
  if (f.authType === 'anonymous') return q.like('user_id', 'anon_%')
  if (f.authType === 'firebase') return q.not('user_id', 'like', 'anon_%')
  return q
}
function scopeSubjectTopic(q: AnyQuery, f: AdminFilters): AnyQuery {
  let out = q
  if (f.subject) out = out.eq('subject', f.subject)
  if (f.topicId) out = out.eq('topic_id', f.topicId)
  return out
}

const SESSION_COLS =
  'id, user_id, subject, topic_id, session_type, status, total_questions, answered_questions, correct_count, score, drop_off_question_index, started_at, completed_at'
const ATTEMPT_COLS =
  'user_id, session_id, question_id, subject, topic_id, question_type, attempt_context, is_correct, is_first_try_in_session, was_scheduled_on_time, created_at'
const SRS_COLS = 'user_id, question_id, subject, topic_id, interval_days, ease_factor, repetitions, next_review_at, last_reviewed_at'
const AI_COLS =
  'user_id, session_id, question_id, subject, topic_id, question_type, model_name, input_tokens, output_tokens, estimated_cost_usd, helpfulness_rating, is_requery, latency_ms, created_at'

export async function loadSessions(sb: SupabaseClient, f: AdminFilters): Promise<Loaded<SessionRow>> {
  const loaded = await fetchAll<SessionRow>('sessions', async (a, b) => {
    let q: AnyQuery = sb.from('study_sessions').select(SESSION_COLS).gte('started_at', f.from).lte('started_at', f.to)
    q = scopeSubjectTopic(scopeAuth(q, f), f)
    if (f.sessionType) q = q.eq('session_type', f.sessionType)
    return q.order('started_at', { ascending: true }).order('id').range(a, b)
  })
  return { ...loaded, rows: loaded.rows.filter((r) => authOk(f, r.user_id)) }
}

/** Sự kiện hoạt động (mỗi phiên học = 1 sự kiện) từ (cuối khoảng − 29 ngày) tới hiện tại; chỉ lọc theo loại người dùng. */
export async function loadActivity(sb: SupabaseClient, f: AdminFilters, nowMs: number): Promise<Loaded<ActivityRow>> {
  const sinceMs = Math.min(Date.parse(f.from), Date.parse(f.to) - 29 * DAY_MS)
  const loaded = await fetchAll<ActivityRow>('activity', async (a, b) => {
    const q: AnyQuery = sb
      .from('study_sessions')
      .select('user_id, started_at')
      .gte('started_at', new Date(sinceMs).toISOString())
      .lte('started_at', new Date(nowMs).toISOString())
    return scopeAuth(q, f).order('started_at', { ascending: true }).order('id').range(a, b)
  })
  return { ...loaded, rows: loaded.rows.filter((r) => authOk(f, r.user_id)) }
}

export async function loadNewProfiles(sb: SupabaseClient, f: AdminFilters): Promise<Loaded<ProfileRow>> {
  const loaded = await fetchAll<ProfileRow>('profiles', async (a, b) => {
    const q: AnyQuery = sb
      .from('user_analytics_profiles')
      .select('user_id, auth_provider, referral_source, first_seen_at, last_seen_at')
      .gte('first_seen_at', f.from)
      .lte('first_seen_at', f.to)
    return scopeAuth(q, f).order('first_seen_at', { ascending: true }).order('user_id').range(a, b)
  })
  return { ...loaded, rows: loaded.rows.filter((r) => authOk(f, r.user_id)) }
}

export async function countUsers(sb: SupabaseClient, f: AdminFilters): Promise<number> {
  const q: AnyQuery = sb.from('user_analytics_profiles').select('user_id', { count: 'exact', head: true }).lte('first_seen_at', f.to)
  const { count, error } = await scopeAuth(q, f)
  if (error) {
    console.error('[admin/stats] count users', error.code, error.message)
    throw new HttpError(500, 'Không đọc được dữ liệu thống kê.')
  }
  return count ?? 0
}

export async function loadAttempts(sb: SupabaseClient, f: AdminFilters): Promise<Loaded<AttemptRow>> {
  const loaded = await fetchAll<AttemptRow>('attempts', async (a, b) => {
    // Lọc theo loại phiên qua quan hệ (inner join) question_attempts.session_id → study_sessions.
    const select = f.sessionType ? `${ATTEMPT_COLS}, study_sessions!inner(session_type)` : ATTEMPT_COLS
    let q: AnyQuery = sb.from('question_attempts').select(select).gte('created_at', f.from).lte('created_at', f.to)
    q = scopeSubjectTopic(scopeAuth(q, f), f)
    if (f.sessionType) q = q.eq('study_sessions.session_type', f.sessionType)
    return q.order('created_at', { ascending: true }).order('id').range(a, b)
  })
  return { ...loaded, rows: loaded.rows.filter((r) => authOk(f, r.user_id)) }
}

/** Trạng thái lịch ôn HIỆN TẠI (không giới hạn theo khoảng thời gian); lọc môn / chuyên đề / loại người dùng. */
export async function loadSrs(sb: SupabaseClient, f: AdminFilters): Promise<Loaded<SrsRow>> {
  const loaded = await fetchAll<SrsRow>('srs', async (a, b) => {
    const q: AnyQuery = sb.from('spaced_repetition_items').select(SRS_COLS)
    return scopeSubjectTopic(scopeAuth(q, f), f).order('id').range(a, b)
  })
  return { ...loaded, rows: loaded.rows.filter((r) => authOk(f, r.user_id)) }
}

export async function loadAi(sb: SupabaseClient, f: AdminFilters): Promise<Loaded<AiRow>> {
  const loaded = await fetchAll<AiRow>('ai', async (a, b) => {
    let q: AnyQuery = sb.from('ai_interactions').select(AI_COLS).gte('created_at', f.from).lte('created_at', f.to)
    q = scopeSubjectTopic(scopeAuth(q, f), f)
    return q.order('created_at', { ascending: true }).order('id').range(a, b)
  })
  let rows = loaded.rows.filter((r) => authOk(f, r.user_id))

  // ai_interactions không có khóa ngoại tới phiên → tra loại phiên theo từng lô session_id.
  if (f.sessionType) {
    const ids = [...new Set(rows.map((r) => r.session_id).filter((v): v is string => !!v))]
    const matching = new Set<string>()
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await sb
        .from('study_sessions')
        .select('id')
        .in('id', ids.slice(i, i + 100))
        .eq('session_type', f.sessionType)
      if (error) {
        console.error('[admin/stats] ai session types', error.code, error.message)
        throw new HttpError(500, 'Không đọc được dữ liệu thống kê.')
      }
      for (const r of data ?? []) matching.add(r.id as string)
    }
    rows = rows.filter((r) => r.session_id && matching.has(r.session_id))
  }
  return { ...loaded, rows }
}

/** Dựng toàn bộ báo cáo cho một bộ lọc. */
export async function buildSummary(sb: SupabaseClient, filters: AdminFilters, nowMs = Date.now()): Promise<AdminSummary> {
  const [totalUsers, newProfiles, activity, sessions, attempts, srs, ai] = await Promise.all([
    countUsers(sb, filters),
    loadNewProfiles(sb, filters),
    loadActivity(sb, filters, nowMs),
    loadSessions(sb, filters),
    loadAttempts(sb, filters),
    loadSrs(sb, filters),
    loadAi(sb, filters),
  ])

  const truncated = (
    [
      ['Người dùng mới', newProfiles],
      ['Hoạt động (DAU/WAU/MAU, retention)', activity],
      ['Phiên học', sessions],
      ['Lượt trả lời', attempts],
      ['Lịch ôn ngắt quãng', srs],
      ['Gia sư AI', ai],
    ] as const
  )
    .filter(([, loaded]) => loaded.truncated)
    .map(([name]) => name)

  return {
    filters,
    generatedAt: new Date(nowMs).toISOString(),
    truncated,
    overview: aggregateOverview({ filters, nowMs, totalUsers, newProfiles: newProfiles.rows, activity: activity.rows }),
    learning: aggregateLearning(sessions.rows, attempts.rows),
    srs: aggregateSrs({ filters, nowMs, items: srs.rows, attempts: attempts.rows }),
    ai: aggregateAi(ai.rows, filters),
  }
}

/** Danh sách môn / chuyên đề để dựng ô lọc (lấy từ các phiên gần đây, không phụ thuộc bộ lọc hiện tại). */
export async function loadFacets(sb: SupabaseClient, nowMs = Date.now()): Promise<AdminFacets> {
  const since = new Date(nowMs - 120 * DAY_MS).toISOString()
  const { rows } = await fetchAll<{ subject: string | null; topic_id: string | null }>(
    'facets',
    async (a, b) =>
      (sb as SupabaseClient)
        .from('study_sessions')
        .select('subject, topic_id')
        .gte('started_at', since)
        .order('started_at', { ascending: false })
        .order('id')
        .range(a, b),
    20_000
  )
  const subjects = new Set<string>()
  const topics = new Map<string, string | null>()
  for (const r of rows) {
    if (r.subject) subjects.add(r.subject)
    if (r.topic_id && !topics.has(r.topic_id)) topics.set(r.topic_id, r.subject)
  }
  return {
    subjects: [...subjects].sort(),
    topics: [...topics].map(([topicId, subject]) => ({ topicId, subject })).sort((a, b) => a.topicId.localeCompare(b.topicId, 'vi')),
  }
}
