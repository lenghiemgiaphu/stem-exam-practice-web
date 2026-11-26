import { requireAdmin } from '@/lib/admin/auth'
import { loadFacets } from '@/lib/admin/stats'
import { disabledResponse, failure, json } from '@/lib/analytics/http'
import { enforceRateLimit } from '@/lib/analytics/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** GET /api/admin/analytics/facets — danh sách môn / chuyên đề cho các ô lọc. */
export async function GET(req: Request) {
  try {
    requireAdmin(req)
    enforceRateLimit(req, 'admin-facets', undefined, { ip: 60 })
    const supabase = getSupabaseAdmin()
    if (!supabase) return disabledResponse()
    return json({ ok: true, facets: await loadFacets(supabase) })
  } catch (error) {
    return failure('admin/facets', error)
  }
}
