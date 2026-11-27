import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { assertSameOrigin, dbError, disabledResponse, failure, json, readJson } from '@/lib/analytics/http'
import { enforceRateLimit } from '@/lib/analytics/rate-limit'
import { RETEST_MAX_DAYS, RETEST_MIN_DAYS } from '@/lib/analytics/constants'
import { addDays, SM2_INITIAL, sm2Next, sm2Quality } from '@/lib/analytics/sm2'
import { idText, optionalText, sessionIdSchema, userIdSchema, type AttemptContext } from '@/lib/analytics/schemas'
import { HttpError } from '@/lib/quiz/errors'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  userId: userIdSchema,
  sessionId: sessionIdSchema.nullish(),
  attempts: z
    .array(
      z.object({
        questionId: idText,
        subject: optionalText(32),
        topicId: optionalText(128),
        questionType: optionalText(32),
        /** Đúng hoàn toàn. (Câu Đúng/Sai nhiều ý: chỉ true khi đúng cả 4 ý — quy ước ở phía client.) */
        isCorrect: z.boolean(),
      }),
    )
    .min(1)
    .max(200),
})

interface SrItem {
  question_id: string
  subject: string | null
  topic_id: string | null
  interval_days: number
  ease_factor: number
  repetitions: number
  next_review_at: string
}

/**
 * POST /api/analytics/attempts
 * Ghi các lượt trả lời và cập nhật lịch ôn tập ngắt quãng (SM-2).
 *
 * Server tự xác định (không tin client):
 *  - attempt_context: 'spaced_review' nếu phiên là spaced_review; 'retest' nếu user đã làm câu này ở
 *    phiên khác cách đây 7–14 ngày; còn lại 'initial'.
 *  - is_first_try_in_session: lần đầu câu này xuất hiện trong phiên.
 *  - was_scheduled_on_time: chỉ với lần làm đầu tiên của câu ĐÃ có trong lịch ôn — true nếu lúc làm
 *    câu đó đã đến hạn (next_review_at <= now), false nếu làm sớm hơn lịch; null nếu chưa có lịch.
 *
 * SM-2 chỉ chạy cho lần làm ĐẦU TIÊN của mỗi câu trong phiên, để "Làm lại câu này" không làm
 * khoảng cách ôn tập tăng ảo.
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    // Chưa cấu hình Supabase → 200 { disabled: true } ngay (xem ghi chú ở identify/route.ts).
    const supabase = getSupabaseAdmin()
    if (!supabase) return disabledResponse()

    const body = bodySchema.parse(await readJson(req, 128 * 1024))
    enforceRateLimit(req, 'attempts', body.userId, { ip: 240, user: 60 })

    const userId = body.userId
    const sessionId = body.sessionId ?? null
    const now = new Date()

    let session: { session_type: string; subject: string | null; topic_id: string | null } | null = null
    if (sessionId) {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('user_id, session_type, subject, topic_id')
        .eq('id', sessionId)
        .maybeSingle()
      if (error) throw dbError('attempts/session', error)
      if (!data || data.user_id !== userId) throw new HttpError(404, 'Không tìm thấy phiên học.')
      session = data
    }

    const questionIds = [...new Set(body.attempts.map((a) => a.questionId))]

    let retestQuery = supabase
      .from('question_attempts')
      .select('question_id')
      .eq('user_id', userId)
      .in('question_id', questionIds)
      .gte('created_at', addDays(now, -RETEST_MAX_DAYS).toISOString())
      .lte('created_at', addDays(now, -RETEST_MIN_DAYS).toISOString())
    if (sessionId) retestQuery = retestQuery.or(`session_id.is.null,session_id.neq.${sessionId}`)

    const [srRes, retestRes, sameSessionRes] = await Promise.all([
      supabase.from('spaced_repetition').select('*').eq('user_id', userId).in('question_id', questionIds),
      retestQuery,
      sessionId
        ? supabase.from('question_attempts').select('question_id').eq('session_id', sessionId).in('question_id', questionIds)
        : Promise.resolve({ data: [] as Array<{ question_id: string }>, error: null }),
    ])
    if (srRes.error) throw dbError('attempts/sr', srRes.error)
    if (retestRes.error) throw dbError('attempts/retest', retestRes.error)
    if (sameSessionRes.error) throw dbError('attempts/same-session', sameSessionRes.error)

    const srByQuestion = new Map<string, SrItem>((srRes.data as SrItem[]).map((r) => [r.question_id, r]))
    const retestSet = new Set((retestRes.data ?? []).map((r) => r.question_id as string))
    const seenInSession = new Set((sameSessionRes.data ?? []).map((r) => r.question_id as string))
    const spacedSession = session?.session_type === 'spaced_review'

    const seenInBatch = new Set<string>()
    const rows = body.attempts.map((a) => {
      const isFirstTry = !seenInSession.has(a.questionId) && !seenInBatch.has(a.questionId)
      seenInBatch.add(a.questionId)
      const item = srByQuestion.get(a.questionId)
      const context: AttemptContext = spacedSession ? 'spaced_review' : retestSet.has(a.questionId) ? 'retest' : 'initial'
      return {
        session_id: sessionId,
        user_id: userId,
        question_id: a.questionId,
        subject: a.subject || session?.subject || item?.subject || null,
        topic_id: a.topicId || session?.topic_id || item?.topic_id || null,
        question_type: a.questionType || null,
        attempt_context: context,
        is_correct: a.isCorrect,
        is_first_try_in_session: isFirstTry,
        was_scheduled_on_time: isFirstTry && item ? new Date(item.next_review_at).getTime() <= now.getTime() : null,
      }
    })

    const { error: insertError } = await supabase.from('question_attempts').insert(rows)
    if (insertError) throw dbError('attempts/insert', insertError)

    // --- Lịch ôn tập ngắt quãng (SM-2) ---------------------------------------------------------
    const scheduleRows = rows
      .filter((r) => r.is_first_try_in_session)
      .map((r) => {
        const item = srByQuestion.get(r.question_id)
        const prev = item
          ? { intervalDays: item.interval_days, easeFactor: Number(item.ease_factor), repetitions: item.repetitions }
          : SM2_INITIAL
        const next = sm2Next(prev, sm2Quality(r.is_correct))
        return {
          user_id: userId,
          question_id: r.question_id,
          subject: r.subject,
          topic_id: r.topic_id,
          interval_days: next.intervalDays,
          ease_factor: next.easeFactor,
          repetitions: next.repetitions,
          next_review_at: addDays(now, next.intervalDays).toISOString(),
          last_reviewed_at: now.toISOString(),
        }
      })

    // Mọi lượt trong request đều là "làm lại" trong cùng phiên → không có gì để xếp lịch.
    if (!scheduleRows.length) return json({ ok: true, saved: rows.length, scheduleUpdated: 0 })

    const { error: scheduleError } = await supabase
      .from('spaced_repetition')
      .upsert(scheduleRows, { onConflict: 'user_id,question_id' })
    if (scheduleError) {
      // Lượt trả lời đã được lưu; lỗi lịch ôn không nên làm hỏng cả request.
      console.error('[analytics/attempts] không cập nhật được lịch ôn', scheduleError.code, scheduleError.message)
      return json({ ok: true, saved: rows.length, scheduleUpdated: 0, warning: 'schedule-update-failed' })
    }

    return json({ ok: true, saved: rows.length, scheduleUpdated: scheduleRows.length })
  } catch (error) {
    return failure('analytics/attempts', error)
  }
}
