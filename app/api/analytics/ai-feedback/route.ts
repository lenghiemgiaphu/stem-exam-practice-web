import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { assertSameOrigin, dbError, disabledResponse, failure, json, readJson } from '@/lib/analytics/http'
import { enforceRateLimit } from '@/lib/analytics/rate-limit'
import { userIdSchema } from '@/lib/analytics/schemas'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  interactionId: z.uuid(),
  userId: userIdSchema,
  rating: z.union([z.literal(1), z.literal(-1)]),
})

/** POST /api/analytics/ai-feedback — ghi 👍 (1) / 👎 (-1) cho một lượt hỏi AI. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    const body = bodySchema.parse(await readJson(req))
    enforceRateLimit(req, 'ai-feedback', body.userId, { ip: 120, user: 30 })

    const supabase = getSupabaseAdmin()
    if (!supabase) return disabledResponse()

    const { data, error } = await supabase
      .from('ai_interactions')
      .update({ helpfulness_rating: body.rating })
      .eq('id', body.interactionId)
      .eq('user_id', body.userId) // chỉ người đã hỏi mới đánh giá được
      .select('id')
    if (error) throw dbError('ai-feedback', error)

    return json({ ok: true, updated: (data?.length ?? 0) > 0 })
  } catch (error) {
    return failure('analytics/ai-feedback', error)
  }
}
