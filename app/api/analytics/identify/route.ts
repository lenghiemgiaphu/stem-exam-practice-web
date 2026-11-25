import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { assertSameOrigin, dbError, disabledResponse, failure, json, readJson } from '@/lib/analytics/http'
import { enforceRateLimit } from '@/lib/analytics/rate-limit'
import { AUTH_PROVIDERS, COHORT_TAGS, optionalText, userIdSchema } from '@/lib/analytics/schemas'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  userId: userIdSchema,
  authProvider: z.enum(AUTH_PROVIDERS).default('anonymous'),
  cohortTag: z.enum(COHORT_TAGS).nullish(),
  referralSource: optionalText(64),
})

const TABLE = 'user_analytics_profiles'

/**
 * POST /api/analytics/identify
 * Upsert hồ sơ người học:
 *  - lần đầu: tạo hàng mới;
 *  - các lần sau: CHỈ cập nhật last_seen_at (first_seen_at được giữ nguyên);
 *    cohort_tag chỉ được nâng lên 'nang_cao_nguyen' (không bao giờ hạ về 'general');
 *    referral_source chỉ ghi khi đang trống (giữ nguồn truy cập đầu tiên).
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    const body = bodySchema.parse(await readJson(req))
    enforceRateLimit(req, 'identify', body.userId, { ip: 120, user: 20 })

    const supabase = getSupabaseAdmin()
    if (!supabase) return disabledResponse()

    const now = new Date().toISOString()
    // Mã khách luôn là 'anonymous', bất kể client khai gì.
    const authProvider = body.userId.startsWith('anon_') ? 'anonymous' : body.authProvider
    const wantsNcn = body.cohortTag === 'nang_cao_nguyen'
    const referral = body.referralSource?.trim() || null

    const { data: existing, error: readError } = await supabase
      .from(TABLE)
      .select('user_id, cohort_tag, referral_source')
      .eq('user_id', body.userId)
      .maybeSingle()
    if (readError) throw dbError('identify', readError)

    let cohortTag: string = existing?.cohort_tag ?? (wantsNcn ? 'nang_cao_nguyen' : 'general')

    if (!existing) {
      const { error } = await supabase.from(TABLE).insert({
        user_id: body.userId,
        cohort_tag: cohortTag,
        auth_provider: authProvider,
        referral_source: referral,
        first_seen_at: now,
        last_seen_at: now,
      })
      if (!error) return json({ ok: true, userId: body.userId, cohortTag })
      // 23505 = hai request tạo đồng thời → hàng đã tồn tại, chuyển sang cập nhật bên dưới.
      if (error.code !== '23505') throw dbError('identify', error)
    }

    const patch: Record<string, unknown> = { last_seen_at: now, auth_provider: authProvider }
    if (wantsNcn) {
      patch.cohort_tag = 'nang_cao_nguyen'
      cohortTag = 'nang_cao_nguyen'
    }
    if (referral && !existing?.referral_source) patch.referral_source = referral

    const { error } = await supabase.from(TABLE).update(patch).eq('user_id', body.userId)
    if (error) throw dbError('identify', error)

    return json({ ok: true, userId: body.userId, cohortTag })
  } catch (error) {
    return failure('analytics/identify', error)
  }
}
