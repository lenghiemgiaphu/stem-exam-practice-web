/**
 * Kiểu dữ liệu dùng chung giữa server (tổng hợp) và client (dashboard).
 * File này CHỈ chứa kiểu — không import module nào — để client component import an toàn.
 */
export type SessionType = 'exam' | 'topic_practice' | 'spaced_review'
export type AuthType = 'firebase' | 'anonymous'
export type RangePreset = '7d' | '30d' | '90d' | 'custom'
export type AttemptContext = 'initial' | 'retest' | 'spaced_review'

export interface AdminFilters {
  range: RangePreset
  /** ISO, đầu ngày (giờ VN) của ngày bắt đầu. */
  from: string
  /** ISO, thời điểm kết thúc khoảng thời gian. */
  to: string
  subject: string | null
  topicId: string | null
  sessionType: SessionType | null
  authType: AuthType | null
}

export interface DayCount {
  date: string
  count: number
}

export interface Retention {
  /** Số người dùng mới đã đủ ngày để xét. */
  eligible: number
  retained: number
  rate: number | null
}

export interface OverviewStats {
  totalUsers: number
  newUsers: number
  active: { dau: number; wau: number; mau: number }
  dailyNewUsers: DayCount[]
  dailyActiveUsers: DayCount[]
  retention: { d1: Retention; d7: Retention }
  referrals: { source: string; users: number }[]
}

export interface AccuracyRow {
  attempts: number
  correct: number
  accuracy: number | null
  firstTryAttempts: number
  firstTryCorrect: number
  firstTryAccuracy: number | null
}

export interface LearningStats {
  sessions: {
    total: number
    completed: number
    abandoned: number
    inProgress: number
    completionRate: number | null
    abandonRate: number | null
  }
  avgScore: number | null
  avgAccuracy: number | null
  /** Vị trí câu (bắt đầu từ 1; 30 = "30 trở lên") nơi người học bỏ dở. */
  dropOff: { position: number; count: number }[]
  dropOffUnknown: number
  byContext: (AccuracyRow & { context: AttemptContext })[]
  bySubject: (AccuracyRow & { subject: string; sessions: number; completedSessions: number; avgScore: number | null })[]
  byTopic: (AccuracyRow & { topicId: string; subject: string | null })[]
}

export interface SrsStats {
  itemsTracked: number
  dueNow: number
  overdue7d: number
  reviewedItemsInWindow: number
  reviewAttempts: number
  reviewCorrectRate: number | null
  onTime: { total: number; onTime: number; rate: number | null }
  onTimeSpacedReview: { total: number; onTime: number; rate: number | null }
  intervalDistribution: { bucket: string; count: number }[]
  avgEaseFactor: number | null
  avgRepetitions: number | null
}

export interface AiStats {
  totalInteractions: number
  inputTokens: number
  outputTokens: number
  totalCostUsd: number
  avgCostUsd: number | null
  helpfulness: { up: number; down: number; rated: number; rate: number | null; coverage: number | null }
  requeryRate: number | null
  requeryCount: number
  avgLatencyMs: number | null
  p95LatencyMs: number | null
  byModel: { model: string; count: number; inputTokens: number; outputTokens: number; costUsd: number }[]
  daily: { date: string; count: number; costUsd: number }[]
}

export interface AdminSummary {
  filters: AdminFilters
  generatedAt: string
  /** Tên các nhóm dữ liệu bị cắt vì vượt giới hạn số hàng (số liệu có thể thiếu). */
  truncated: string[]
  overview: OverviewStats
  learning: LearningStats
  srs: SrsStats
  ai: AiStats
}

export interface AdminFacets {
  subjects: string[]
  topics: { topicId: string; subject: string | null }[]
}
