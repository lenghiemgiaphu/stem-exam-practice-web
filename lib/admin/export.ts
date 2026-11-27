import { anonymizeUserId } from '@/lib/admin/auth'
import type { AdminSummary } from '@/lib/admin/types'

export type DetailLevel = 'sessions' | 'attempts' | 'srs' | 'ai'
type Cell = string | number | boolean | null | undefined

/** Ô CSV: bọc nháy kép khi cần và chặn "CSV injection" (ô văn bản bắt đầu bằng = + - @ bị Excel hiểu là công thức). */
export function csvCell(value: Cell): string {
  if (value == null) return ''
  let text = String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** CSV có BOM UTF-8 để Excel hiển thị đúng tiếng Việt. */
export function toCsv(columns: string[], rows: Record<string, Cell>[]): string {
  const lines = [columns.map(csvCell).join(',')]
  for (const row of rows) lines.push(columns.map((c) => csvCell(row[c])).join(','))
  return `\uFEFF${lines.join('\r\n')}\r\n`
}

const LABEL_KEYS = ['date', 'position', 'context', 'topicId', 'source', 'bucket', 'model', 'subject']

/** Làm phẳng báo cáo tổng hợp thành các dòng "đường dẫn chỉ số → giá trị" (dùng cho CSV). */
export function flattenSummary(summary: AdminSummary): { metric: string; value: Cell }[] {
  const out: { metric: string; value: Cell }[] = []

  // `skipKey`: khóa đã được dùng làm nhãn của phần tử mảng (nằm trong đường dẫn) nên không lặp lại thành dòng riêng.
  const walk = (value: unknown, path: string, skipKey?: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>
          const labelKey = LABEL_KEYS.find((k) => typeof record[k] === 'string' || typeof record[k] === 'number')
          walk(item, `${path}[${labelKey ? record[labelKey] : index}]`, labelKey)
        } else {
          out.push({ metric: `${path}[${index}]`, value: item as Cell })
        }
      })
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (key !== skipKey) walk(child, path ? `${path}.${key}` : key)
      }
    } else {
      out.push({ metric: path, value: value as Cell })
    }
  }

  walk({ ...summary, truncated: summary.truncated.join('; ') }, '')
  return out
}

export const summaryToCsv = (summary: AdminSummary) => toCsv(['metric', 'value'], flattenSummary(summary))

const COLUMNS: Record<DetailLevel, string[]> = {
  sessions: ['id', 'user', 'subject', 'topic_id', 'session_type', 'status', 'total_questions', 'answered_questions', 'correct_count', 'score', 'drop_off_question_index', 'started_at', 'ended_at'],
  attempts: ['user', 'session_id', 'question_id', 'subject', 'topic_id', 'question_type', 'attempt_context', 'is_correct', 'is_first_try_in_session', 'was_scheduled_on_time', 'created_at'],
  srs: ['user', 'question_id', 'subject', 'topic_id', 'interval_days', 'ease_factor', 'repetitions', 'next_review_at', 'last_reviewed_at'],
  ai: ['user', 'session_id', 'question_id', 'subject', 'topic_id', 'question_type', 'model_name', 'input_tokens', 'output_tokens', 'estimated_cost_usd', 'feedback_rating', 'is_requery', 'latency_ms', 'created_at'],
}

export const detailColumns = (level: DetailLevel) => COLUMNS[level]

/** Xuất mức chi tiết: user_id được thay bằng mã băm một chiều (không thể suy ngược ra người dùng). */
export function anonymizeRows(level: DetailLevel, rows: ReadonlyArray<{ user_id: string }>): Record<string, Cell>[] {
  return rows.map((row) => {
    const { user_id: userId, ...rest } = row as { user_id: string } & Record<string, Cell>
    const out: Record<string, Cell> = { ...rest, user: anonymizeUserId(userId) }
    return Object.fromEntries(COLUMNS[level].map((c) => [c, out[c]]))
  })
}
