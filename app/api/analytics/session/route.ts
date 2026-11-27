import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { assertSameOrigin, dbError, disabledResponse, failure, json, readJson } from '@/lib/analytics/http'
import { enforceRateLimit } from '@/lib/analytics/rate-limit'
import { SESSION_TYPES, nonNegativeInt, optionalText, sessionIdSchema, userIdSchema } from '@/lib/analytics/schemas'

export const dynamic = 'force-dynamic'

const TABLE = 'study_sessions'

const progress = {
  totalQuestions: nonNegativeInt(1000).optional(),
  answeredQuestions: nonNegativeInt(1000).optional(),
  correctCount: nonNegativeInt(1000).optional(),
}

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('start'),
    userId: userIdSchema,
    sessionType: z.enum(SESSION_TYPES),
    subject: optionalText(32),
    topicId: optionalText(128),
    examId: optionalText(128),
    totalQuestions: nonNegativeInt(1000).default(0),
  }),
  z.object({
    action: z.literal('complete'),
    userId: userIdSchema,
    sessionId: sessionIdSchema,
    ...progress,
    /** Thang điểm 10 của ứng dụng (cho phép tới 100 để chứa cả thang %). */
    score: z.number().min(0).max(100).nullish(),
  }),
  z.object({
    action: z.literal('abandon'),
    userId: userIdSchema,
    sessionId: sessionIdSchema,
    ...progress,
    /** Chỉ số (bắt đầu từ 0) của câu hỏi người học đang xem khi rời đi. */
    dropOffQuestionIndex: nonNegativeInt(1000).nullish(),
  }),
])

const compact = (obj: Record<string, unknown>) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))

/**
 * POST /api/analytics/session
 *  - action 'start'    → tạo phiên mới, trả về { sessionId }
 *  - action 'complete' → đánh dấu hoàn thành (kể cả khi trước đó lỡ bị đánh dấu bỏ dở)
 *  - action 'abandon'  → đánh dấu bỏ dở (chỉ khi phiên còn 'active'); hỗ trợ navigator.sendBeacon
 * Cả complete lẫn abandon đều ghi ended_at (thời điểm kết thúc phiên).
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    // Chưa cấu hình Supabase → 200 { disabled: true } ngay (xem ghi chú ở identify/route.ts).
    const supabase = getSupabaseAdmin()
    if (!supabase) return disabledResponse()

    const body = bodySchema.parse(await readJson(req))
    enforceRateLimit(req, 'session', body.userId, { ip: 240, user: 60 })

    if (body.action === 'start') {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          user_id: body.userId,
          session_type: body.sessionType,
          subject: body.subject || null,
          topic_id: body.topicId || null,
          exam_id: body.examId || null,
          status: 'active',
          total_questions: body.totalQuestions,
        })
        .select('id')
        .single()
      if (error || !data) throw dbError('session/start', error)
      return json({ ok: true, sessionId: data.id })
    }

    const common = compact({
      total_questions: body.totalQuestions,
      answered_questions: body.answeredQuestions,
      correct_count: body.correctCount,
    })

    if (body.action === 'complete') {
      const { data, error } = await supabase
        .from(TABLE)
        .update({
          ...common,
          ...compact({ score: body.score ?? undefined }),
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', body.sessionId)
        .eq('user_id', body.userId) // chỉ chủ phiên mới được cập nhật
        .in('status', ['active', 'abandoned'])
        .select('id')
      if (error) throw dbError('session/complete', error)
      return json({ ok: true, updated: (data?.length ?? 0) > 0 })
    }

    // abandon: không bao giờ ghi đè phiên đã hoàn thành.
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        ...common,
        ...compact({ drop_off_question_index: body.dropOffQuestionIndex ?? undefined }),
        status: 'abandoned',
        ended_at: new Date().toISOString(),
      })
      .eq('id', body.sessionId)
      .eq('user_id', body.userId)
      .eq('status', 'active')
      .select('id')
    if (error) throw dbError('session/abandon', error)
    return json({ ok: true, updated: (data?.length ?? 0) > 0 })
  } catch (error) {
    return failure('analytics/session', error)
  }
}
