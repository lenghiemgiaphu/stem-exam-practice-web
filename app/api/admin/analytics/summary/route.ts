import { requireAdmin } from '@/lib/admin/auth'
import { parseFilters } from '@/lib/admin/filters'
import { buildSummary } from '@/lib/admin/stats'
import { disabledResponse, failure, json } from '@/lib/analytics/http'
import { enforceRateLimit } from '@/lib/analytics/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/admin/analytics/summary?range=30d|7d|90d|custom[&from=YYYY-MM-DD&to=YYYY-MM-DD]
 *     [&subject=][&topicId=][&sessionType=][&authType=]
 * Báo cáo tổng hợp cho dashboard. Yêu cầu cookie quản trị hợp lệ.
 */
export async function GET(req: Request) {
  try {
    requireAdmin(req)
    enforceRateLimit(req, 'admin-summary', undefined, { ip: 60 })
    const filters = parseFilters(new URL(req.url).searchParams)
    const supabase = getSupabaseAdmin()
    if (!supabase) return disabledResponse()
    return json({ ok: true, summary: await buildSummary(supabase, filters) })
  } catch (error) {
    return failure('admin/summary', error)
  }
}
