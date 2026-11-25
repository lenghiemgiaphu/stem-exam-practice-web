import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { dbError, disabledResponse, failure, json } from '@/lib/analytics/http'
import { enforceRateLimit } from '@/lib/analytics/rate-limit'
import { optionalText, userIdSchema } from '@/lib/analytics/schemas'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  userId: userIdSchema,
  limit: z.coerce.number().int().min(1).max(200).default(50),
  subject: optionalText(32),
})

/**
 * GET /api/analytics/due-review?userId=...[&limit=50][&subject=Math]
 * Danh sách câu hỏi đã đến hạn ôn tập ngắt quãng (next_review_at <= now), câu quá hạn lâu nhất trước.
 */
export async function GET(req: Request) {
  try {
    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    enforceRateLimit(req, 'due-review', params.userId, { ip: 240, user: 30 })

    const supabase = getSupabaseAdmin()
    if (!supabase) return disabledResponse({ count: 0, questionIds: [], items: [] })

    let query = supabase
      .from('spaced_repetition_items')
      .select('question_id, subject, topic_id, next_review_at')
      .eq('user_id', params.userId)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })
      .limit(params.limit)
    if (params.subject) query = query.eq('subject', params.subject)

    const { data, error } = await query
    if (error) throw dbError('due-review', error)

    const items = (data ?? []).map((r) => ({
      questionId: r.question_id as string,
      subject: r.subject as string | null,
      topicId: r.topic_id as string | null,
      nextReviewAt: r.next_review_at as string,
    }))
    return json({ ok: true, count: items.length, questionIds: items.map((i) => i.questionId), items })
  } catch (error) {
    return failure('analytics/due-review', error)
  }
}
