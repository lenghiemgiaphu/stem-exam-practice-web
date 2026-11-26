'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AccuracyRow, AdminFacets, AdminSummary, AuthType, RangePreset, SessionType } from '@/lib/admin/types'

/* ------------------------------------------------------------------ định dạng */
const nf = new Intl.NumberFormat('vi-VN')
const int = (n: number | null | undefined) => (n == null ? '—' : nf.format(Math.round(n)))
const pct = (n: number | null | undefined, digits = 1) => (n == null ? '—' : `${(n * 100).toFixed(digits)}%`)
const usd = (n: number | null | undefined, digits = 4) => (n == null ? '—' : `$${n.toFixed(digits)}`)
const ms = (n: number | null | undefined) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)} s` : `${Math.round(n)} ms`)
const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

const SESSION_LABEL: Record<SessionType, string> = { exam: 'Thi thử', topic_practice: 'Luyện chuyên đề', spaced_review: 'Ôn ngắt quãng' }
const CONTEXT_LABEL: Record<string, string> = { initial: 'Lần đầu (initial)', retest: 'Làm lại sau 7–14 ngày (retest)', spaced_review: 'Ôn ngắt quãng (spaced_review)' }
const RANGES: { value: RangePreset; label: string }[] = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: 'custom', label: 'Tùy chọn' },
]
const EXPORT_LEVELS = [
  { value: 'summary', label: 'Tổng hợp (theo bộ lọc)' },
  { value: 'sessions', label: 'Chi tiết: phiên học' },
  { value: 'attempts', label: 'Chi tiết: lượt trả lời' },
  { value: 'srs', label: 'Chi tiết: lịch ôn ngắt quãng' },
  { value: 'ai', label: 'Chi tiết: lượt hỏi AI' },
]

/* ------------------------------------------------------------------ thành phần giao diện nhỏ */
function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-slate-500">{note}</p>}
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  )
}

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

const Grid = ({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) => (
  <div className={`grid grid-cols-2 gap-3 ${cols === 4 ? 'lg:grid-cols-4' : cols === 3 ? 'lg:grid-cols-3' : ''}`}>{children}</div>
)

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  )
}

const Empty = () => <p className="py-6 text-center text-sm text-slate-400">Chưa có dữ liệu trong bộ lọc này.</p>

/** Biểu đồ cột theo ngày (CSS thuần). */
function Columns({ data, format = int, color = 'bg-indigo-500' }: { data: { label: string; value: number }[]; format?: (n: number) => string; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  if (!data.length || data.every((d) => d.value === 0)) return <Empty />
  const step = Math.ceil(data.length / 10)
  return (
    <div role="img" aria-label="Biểu đồ cột" className="flex h-40 items-end gap-px">
      {data.map((d, i) => (
        <div key={d.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={`${d.label}: ${format(d.value)}`}>
          <div className={`w-full rounded-t ${color}`} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0 }} />
          <span className="mt-1 h-4 text-[10px] leading-4 text-slate-400">{i % step === 0 ? d.label : ''}</span>
        </div>
      ))}
    </div>
  )
}

/** Thanh ngang có nhãn. */
function BarRows({ rows, max }: { rows: { label: string; value: number; display: string }[]; max?: number }) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value))
  if (!rows.length) return <Empty />
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="truncate text-slate-700" title={r.label}>
              {r.label}
            </span>
            <span className="flex-none font-semibold text-slate-900">{r.display}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (r.value / top) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  if (!rows.length) return <Empty />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            {head.map((h, i) => (
              <th key={h} className={`py-2 pr-3 font-semibold ${i ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`py-2 pr-3 ${j ? 'text-right tabular-nums' : 'font-medium text-slate-800'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const accuracyCells = (r: AccuracyRow): ReactNode[] => [int(r.attempts), pct(r.accuracy), pct(r.firstTryAccuracy)]

/* ------------------------------------------------------------------ dashboard */
interface Draft {
  range: RangePreset
  from: string
  to: string
  subject: string
  topicId: string
  sessionType: '' | SessionType
  authType: '' | AuthType
}

export function Dashboard() {
  const [draft, setDraft] = useState<Draft>({ range: '30d', from: '', to: '', subject: '', topicId: '', sessionType: '', authType: '' })
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [facets, setFacets] = useState<AdminFacets>({ subjects: [], topics: [] })
  const [loading, setLoading] = useState(true)
  const [problem, setProblem] = useState<{ kind: 'auth' | 'disabled' | 'error'; message: string } | null>(null)
  const [exportLevel, setExportLevel] = useState('summary')

  // Chuỗi truy vấn chỉ thay đổi khi bộ lọc hợp lệ → mỗi lần đổi bộ lọc tải lại đúng một lần.
  const query = useMemo(() => {
    if (draft.range === 'custom' && !(draft.from && draft.to)) return null
    const p = new URLSearchParams({ range: draft.range })
    if (draft.range === 'custom') {
      p.set('from', draft.from)
      p.set('to', draft.to)
    }
    if (draft.subject) p.set('subject', draft.subject)
    if (draft.topicId) p.set('topicId', draft.topicId)
    if (draft.sessionType) p.set('sessionType', draft.sessionType)
    if (draft.authType) p.set('authType', draft.authType)
    return p.toString()
  }, [draft])

  useEffect(() => {
    fetch('/api/admin/analytics/facets')
      .then((r) => r.json())
      .then((d) => d?.ok && setFacets(d.facets))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    setLoading(true)
    setProblem(null)
    fetch(`/api/admin/analytics/summary?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (response.status === 401) return setProblem({ kind: 'auth', message: 'Phiên đăng nhập đã hết hạn.' })
        if (data?.disabled) return setProblem({ kind: 'disabled', message: 'Máy chủ chưa cấu hình Supabase (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' })
        if (!response.ok || !data?.ok) return setProblem({ kind: 'error', message: data?.error || 'Không tải được số liệu.' })
        setSummary(data.summary)
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setProblem({ kind: 'error', message: 'Không kết nối được máy chủ.' })
      })
      .finally(() => !controller.signal.aborted && setLoading(false))
    return () => controller.abort()
  }, [query])

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const topics = facets.topics.filter((t) => !draft.subject || t.subject === draft.subject)
  const exportHref = (format: 'csv' | 'json') => (query ? `/api/admin/analytics/export?${query}&format=${format}&level=${exportLevel}` : '#')

  async function logout() {
    await fetch('/api/admin/analytics/logout', { method: 'POST' }).catch(() => {})
    window.location.reload()
  }

  const field = 'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900'

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Thống kê học tập</h1>
          <p className="text-sm text-slate-500">Trang quản trị LabLuyen · dữ liệu từ Supabase</p>
        </div>
        <button type="button" onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Đăng xuất
        </button>
      </header>

      {/* Bộ lọc toàn trang */}
      <div className="sticky top-0 z-10 mt-4 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-end gap-3">
          <div role="group" aria-label="Khoảng thời gian" className="flex overflow-hidden rounded-lg border border-slate-300">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={draft.range === r.value}
                onClick={() => update({ range: r.value })}
                className={`px-3 py-1.5 text-sm font-semibold ${draft.range === r.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {draft.range === 'custom' && (
            <>
              <label className="text-xs font-semibold text-slate-600">
                Từ ngày
                <input type="date" value={draft.from} max={draft.to || undefined} onChange={(e) => update({ from: e.target.value })} className={`${field} mt-0.5 block`} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Đến ngày
                <input type="date" value={draft.to} min={draft.from || undefined} onChange={(e) => update({ to: e.target.value })} className={`${field} mt-0.5 block`} />
              </label>
            </>
          )}
          <label className="text-xs font-semibold text-slate-600">
            Môn học
            <select value={draft.subject} onChange={(e) => update({ subject: e.target.value, topicId: '' })} className={`${field} mt-0.5 block`}>
              <option value="">Tất cả</option>
              {facets.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Chuyên đề
            <select value={draft.topicId} onChange={(e) => update({ topicId: e.target.value })} className={`${field} mt-0.5 block max-w-56`}>
              <option value="">Tất cả</option>
              {topics.map((t) => (
                <option key={t.topicId} value={t.topicId}>
                  {t.topicId}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Loại phiên
            <select value={draft.sessionType} onChange={(e) => update({ sessionType: e.target.value as Draft['sessionType'] })} className={`${field} mt-0.5 block`}>
              <option value="">Tất cả</option>
              {(Object.keys(SESSION_LABEL) as SessionType[]).map((k) => (
                <option key={k} value={k}>
                  {SESSION_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Loại người dùng
            <select value={draft.authType} onChange={(e) => update({ authType: e.target.value as Draft['authType'] })} className={`${field} mt-0.5 block`}>
              <option value="">Tất cả</option>
              <option value="firebase">Đã đăng nhập (firebase)</option>
              <option value="anonymous">Khách (anonymous)</option>
            </select>
          </label>
          <div className="ml-auto flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Xuất dữ liệu
              <select value={exportLevel} onChange={(e) => setExportLevel(e.target.value)} className={`${field} mt-0.5 block`}>
                {EXPORT_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <a href={exportHref('csv')} aria-disabled={!query} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">
              CSV
            </a>
            <a href={exportHref('json')} aria-disabled={!query} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">
              JSON
            </a>
          </div>
        </div>
        {draft.range === 'custom' && !query && <p className="mt-2 text-xs text-amber-700">Chọn cả ngày bắt đầu và ngày kết thúc để xem số liệu.</p>}
      </div>

      {problem && (
        <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {problem.message}{' '}
          {problem.kind === 'auth' && (
            <button type="button" onClick={() => window.location.reload()} className="font-semibold underline">
              Đăng nhập lại
            </button>
          )}
        </div>
      )}
      {summary && summary.truncated.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Một số nhóm dữ liệu quá lớn nên chỉ đọc 50.000 hàng đầu: <strong>{summary.truncated.join(', ')}</strong>. Hãy thu hẹp khoảng thời gian để số liệu đầy đủ.
        </div>
      )}
      {loading && <p className="mt-4 text-sm text-slate-500">Đang tải số liệu…</p>}

      {summary && (
        <div className={loading ? 'opacity-60 transition' : 'transition'}>
          <Overview s={summary} />
          <Learning s={summary} />
          <Srs s={summary} />
          <Ai s={summary} />
          <p className="mt-10 text-xs text-slate-400">
            Cập nhật lúc {new Date(summary.generatedAt).toLocaleString('vi-VN')} · Ngày tính theo giờ Việt Nam (UTC+7). Xuất mức chi tiết: user_id được ẩn danh hóa bằng mã băm một chiều.
          </p>
        </div>
      )}
    </main>
  )
}

/* ------------------------------------------------------------------ 4 nhóm chỉ số */
function Overview({ s }: { s: AdminSummary }) {
  const o = s.overview
  return (
    <Section
      title="1. Tổng quan người học"
      note="Nhóm này chỉ áp dụng bộ lọc thời gian và loại người dùng. Người dùng hoạt động = có ít nhất một phiên học. DAU/WAU/MAU tính lùi từ cuối khoảng thời gian."
    >
      <Grid>
        <Stat label="Tổng người dùng" value={int(o.totalUsers)} hint="tính đến cuối khoảng" />
        <Stat label="Người dùng mới" value={int(o.newUsers)} hint="trong khoảng đã chọn" />
        <Stat label="DAU / WAU / MAU" value={`${int(o.active.dau)} / ${int(o.active.wau)} / ${int(o.active.mau)}`} />
        <Stat label="Quay lại D1 · D7" value={`${pct(o.retention.d1.rate)} · ${pct(o.retention.d7.rate)}`} hint={`${o.retention.d1.retained}/${o.retention.d1.eligible} · ${o.retention.d7.retained}/${o.retention.d7.eligible}`} />
      </Grid>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Người dùng mới theo ngày">
          <Columns data={o.dailyNewUsers.map((d) => ({ label: shortDate(d.date), value: d.count }))} />
        </Card>
        <Card title="Người dùng hoạt động theo ngày">
          <Columns color="bg-emerald-500" data={o.dailyActiveUsers.map((d) => ({ label: shortDate(d.date), value: d.count }))} />
        </Card>
      </div>
      <Card title="Nguồn truy cập tự nhiên (referral_source, người dùng mới)">
        <BarRows rows={o.referrals.map((r) => ({ label: r.source, value: r.users, display: int(r.users) }))} />
      </Card>
    </Section>
  )
}

function Learning({ s }: { s: AdminSummary }) {
  const l = s.learning
  return (
    <Section title="2. Hiệu quả học tập" note="Độ chính xác: tính trên mọi lượt trả lời; cột “lần đầu” chỉ tính lần làm đầu tiên của mỗi câu trong phiên.">
      <Grid>
        <Stat label="Tỷ lệ hoàn thành" value={pct(l.sessions.completionRate)} hint={`${int(l.sessions.completed)} / ${int(l.sessions.total)} phiên`} />
        <Stat label="Tỷ lệ bỏ dở" value={pct(l.sessions.abandonRate)} hint={`${int(l.sessions.abandoned)} phiên · ${int(l.sessions.inProgress)} chưa đóng`} />
        <Stat label="Điểm trung bình" value={l.avgScore == null ? '—' : `${l.avgScore.toFixed(2)}/10`} hint="phiên đã hoàn thành" />
        <Stat label="Độ chính xác (phiên hoàn thành)" value={pct(l.avgAccuracy)} />
      </Grid>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Vị trí câu hay bỏ dở (30 = từ câu 30 trở đi)">
          <Columns color="bg-rose-500" data={l.dropOff.map((d) => ({ label: String(d.position), value: d.count }))} />
          {l.dropOffUnknown > 0 && <p className="mt-2 text-xs text-slate-500">Không xác định vị trí: {int(l.dropOffUnknown)} phiên.</p>}
        </Card>
        <Card title="Độ chính xác theo ngữ cảnh làm bài">
          <Table
            head={['Ngữ cảnh', 'Lượt', 'Chính xác', 'Lần đầu']}
            rows={l.byContext.map((c) => [CONTEXT_LABEL[c.context] ?? c.context, ...accuracyCells(c)])}
          />
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Theo môn học">
          <Table
            head={['Môn', 'Lượt', 'Chính xác', 'Lần đầu', 'Phiên', 'Điểm TB']}
            rows={l.bySubject.map((r) => [r.subject, ...accuracyCells(r), int(r.sessions), r.avgScore == null ? '—' : r.avgScore.toFixed(2)])}
          />
        </Card>
        <Card title="Theo chuyên đề (20 chuyên đề nhiều lượt nhất)">
          <Table head={['Chuyên đề', 'Lượt', 'Chính xác', 'Lần đầu']} rows={l.byTopic.map((r) => [r.topicId, ...accuracyCells(r)])} />
        </Card>
      </div>
    </Section>
  )
}

function Srs({ s }: { s: AdminSummary }) {
  const r = s.srs
  return (
    <Section title="3. Ôn ngắt quãng (SM-2)" note="Số câu và chu kỳ ôn là trạng thái hiện tại (không phụ thuộc khoảng thời gian); chỉ áp dụng lọc môn, chuyên đề, loại người dùng.">
      <Grid>
        <Stat label="Câu đang theo dõi" value={int(r.itemsTracked)} />
        <Stat label="Đến hạn ôn (hiện tại)" value={int(r.dueNow)} hint={`${int(r.overdue7d)} quá hạn > 7 ngày`} />
        <Stat label="Đã ôn trong khoảng" value={int(r.reviewedItemsInWindow)} hint={`${int(r.reviewAttempts)} lượt · đúng ${pct(r.reviewCorrectRate)}`} />
        <Stat label="Tỷ lệ ôn đúng hạn" value={pct(r.onTime.rate)} hint={`${int(r.onTime.onTime)}/${int(r.onTime.total)} lượt · riêng phiên ôn: ${pct(r.onTimeSpacedReview.rate)}`} />
      </Grid>
      <Card title="Phân bố độ dài chu kỳ ôn (interval_days, ngày)">
        <Columns color="bg-amber-500" data={r.intervalDistribution.map((b) => ({ label: b.bucket, value: b.count }))} />
        <p className="mt-2 text-xs text-slate-500">
          Ease factor TB: {r.avgEaseFactor ?? '—'} · Số lần ôn đúng liên tiếp TB: {r.avgRepetitions ?? '—'}
        </p>
      </Card>
    </Section>
  )
}

function Ai({ s }: { s: AdminSummary }) {
  const a = s.ai
  return (
    <Section title="4. Gia sư AI & chi phí" note="Chi phí ước tính đã gồm cả “thinking tokens” của Gemini 2.5 (không nằm trong số token đầu ra).">
      <Grid>
        <Stat label="Tổng lượt hỏi" value={int(a.totalInteractions)} />
        <Stat label="Token vào / ra" value={`${int(a.inputTokens)} / ${int(a.outputTokens)}`} />
        <Stat label="Tổng chi phí ước tính" value={usd(a.totalCostUsd, 4)} hint={`TB ${usd(a.avgCostUsd, 5)} / lượt`} />
        <Stat label="Độ trễ TB · p95" value={`${ms(a.avgLatencyMs)} · ${ms(a.p95LatencyMs)}`} />
        <Stat label="Tỷ lệ hữu ích" value={pct(a.helpfulness.rate)} hint={`👍 ${a.helpfulness.up} · 👎 ${a.helpfulness.down} · ${pct(a.helpfulness.coverage, 0)} lượt được đánh giá`} />
        <Stat label="Tỷ lệ hỏi lại" value={pct(a.requeryRate)} hint={`${int(a.requeryCount)} lượt trong 10 phút`} />
      </Grid>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Chi phí theo ngày (USD)">
          <Columns color="bg-violet-500" format={(n) => usd(n, 4)} data={a.daily.map((d) => ({ label: shortDate(d.date), value: d.costUsd }))} />
        </Card>
        <Card title="Theo model">
          <Table
            head={['Model', 'Lượt', 'Token vào', 'Token ra', 'Chi phí']}
            rows={a.byModel.map((m) => [m.model, int(m.count), int(m.inputTokens), int(m.outputTokens), usd(m.costUsd, 4)])}
          />
        </Card>
      </div>
    </Section>
  )
}
