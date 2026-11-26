import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/auth'
import { anonymizeRows, detailColumns, summaryToCsv, toCsv, type DetailLevel } from '@/lib/admin/export'
import { parseFilters } from '@/lib/admin/filters'
import { buildSummary, loadAi, loadAttempts, loadSessions, loadSrs } from '@/lib/admin/stats'
import { dayKey } from '@/lib/admin/time'
import { disabledResponse, failure } from '@/lib/analytics/http'
import { enforceRateLimit } from '@/lib/analytics/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const querySchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  level: z.enum(['summary', 'sessions', 'attempts', 'srs', 'ai']).default('summary'),
})

/**
 * GET /api/admin/analytics/export?format=csv|json&level=summary|sessions|attempts|srs|ai&<bộ lọc>
 *  - summary: số liệu tổng hợp theo bộ lọc hiện tại;
 *  - sessions | attempts | srs | ai: dữ liệu chi tiết, user_id đã được ẩn danh hóa (băm một chiều).
 */
export async function GET(req: Request) {
  try {
    requireAdmin(req)
    enforceRateLimit(req, 'admin-export', undefined, { ip: 20 })
    const params = new URL(req.url).searchParams
    const { format, level } = querySchema.parse(Object.fromEntries(params))
    const filters = parseFilters(params)
    const supabase = getSupabaseAdmin()
    if (!supabase) return disabledResponse()

    const stamp = `${dayKey(Date.parse(filters.from))}_${dayKey(Date.parse(filters.to))}`
    const headers = (ext: string, mime: string, truncated: boolean) => ({
      'Content-Type': `${mime}; charset=utf-8`,
      'Content-Disposition': `attachment; filename="labluyen-${level}-${stamp}.${ext}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(truncated ? { 'X-Export-Truncated': 'true' } : {}),
    })
    const respond = (csv: () => string, jsonBody: unknown, truncated: boolean) =>
      format === 'csv'
        ? new Response(csv(), { headers: headers('csv', 'text/csv', truncated) })
        : new Response(JSON.stringify(jsonBody, null, 2), { headers: headers('json', 'application/json', truncated) })

    if (level === 'summary') {
      const summary = await buildSummary(supabase, filters)
      return respond(() => summaryToCsv(summary), summary, summary.truncated.length > 0)
    }

    const loaders = { sessions: loadSessions, attempts: loadAttempts, srs: loadSrs, ai: loadAi } as const
    const loaded = await loaders[level](supabase, filters)
    const rows = anonymizeRows(level as DetailLevel, loaded.rows)
    return respond(
      () => toCsv(detailColumns(level as DetailLevel), rows),
      { filters, level, generatedAt: new Date().toISOString(), truncated: loaded.truncated, count: rows.length, rows },
      loaded.truncated
    )
  } catch (error) {
    return failure('admin/export', error)
  }
}
