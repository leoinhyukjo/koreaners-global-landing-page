import { supabase } from '@/lib/supabase/client'

// 세일즈 파이프라인 미러 (sales_leads) — exec_sales_board 파이프라인이 배치로 적재.
// 입금 계산은 Python(payment_schedule)에서 끝남 → 여기선 읽기·합산만.

export interface SalesLead {
  name: string
  section: string // 협상중 / 운영 중 / 스톨
  funnel: string
  status: string
  first_contact: string
  last_action: string
  last_action_date: string | null
  summary: string
  bigo: string
  due_owner: string
  budget_amount: string
  budget_tag: string
  campaign_month: string | null
  close_month: string | null
  seon_month: string | null // 선금 입금월 또는 "기수령"
  seon_krw: number | null
  jan_month: string | null
  jan_krw: number | null
  conf: string | null // 확정 / 추정 / 미정
  undetermined: boolean
  generated_at: string | null
}

export const SECTION_ORDER = ['협상중', '운영 중', '스톨'] as const

/** sales_leads 전체 조회 (anon client + 로그인 세션, RLS authenticated-only). */
export async function fetchSalesLeads(): Promise<SalesLead[]> {
  const { data, error } = await supabase.from('sales_leads').select('*')
  if (error) {
    console.error('[fetchSalesLeads] 조회 실패:', error.message)
    return []
  }
  return (data ?? []).map((r) => ({
    name: r.name ?? '',
    section: r.section ?? '',
    funnel: r.funnel ?? '(없음)',
    status: r.status ?? '',
    first_contact: r.first_contact ?? '',
    last_action: r.last_action ?? '',
    last_action_date: r.last_action_date ?? null,
    summary: r.summary ?? '',
    bigo: r.bigo ?? '',
    due_owner: r.due_owner ?? '',
    budget_amount: r.budget_amount ?? '',
    budget_tag: r.budget_tag ?? '',
    campaign_month: r.campaign_month ?? null,
    close_month: r.close_month ?? null,
    seon_month: r.seon_month ?? null,
    seon_krw: r.seon_krw == null ? null : Number(r.seon_krw),
    jan_month: r.jan_month ?? null,
    jan_krw: r.jan_krw == null ? null : Number(r.jan_krw),
    conf: r.conf ?? null,
    undetermined: Boolean(r.undetermined),
    generated_at: r.generated_at ?? null,
  })) as SalesLead[]
}

// 월별 흐름(추세) — sales_monthly_flow. 재고(stock) 스냅샷 대신 이벤트 기반이라
// 일별 잡음·체결 역행 노이즈 없음. intake=신규 인입, contracted=순(net) 체결.
export interface MonthlyFlow {
  month: string // 'YYYY-MM'
  intake: number
  contracted: number
}

/** sales_monthly_flow 조회 (월 오름차순). 차트는 최근 N개월만 표시. */
export async function fetchMonthlyFlow(): Promise<MonthlyFlow[]> {
  const { data, error } = await supabase
    .from('sales_monthly_flow')
    .select('*')
    .order('month', { ascending: true })
  if (error) {
    console.error('[fetchMonthlyFlow] 조회 실패:', error.message)
    return []
  }
  return (data ?? []).map((r) => ({
    month: r.month ?? '',
    intake: Number(r.intake ?? 0),
    contracted: Number(r.contracted ?? 0),
  }))
}

/** 'YYYY-MM' → 'M월' 라벨. */
export function flowLabel(month: string): string {
  const p = month.split('-')
  return p.length === 2 ? `${parseInt(p[1], 10)}월` : month
}

// 흐름 차트 축 기준 — 총계 차트와 퍼널 차트가 공유(둘이 어긋나지 않게).
// 리드 트래킹 도입 전(1~2월)은 데이터 미완 → 흐리게. START 이전 월(2025 등 sparse)은 축에서 제외.
export const FLOW_AXIS_START = '2026-01'
const FLOW_INCOMPLETE = new Set(['2026-01', '2026-02'])

export interface FlowMonth {
  month: string // 'YYYY-MM'
  label: string
  incomplete: boolean
}

/**
 * START(2026-01)부터 latest 까지 연속 월 축 생성(빈 월 0 채움 대상).
 * 축이 2개 연도에 걸치면 라벨에 연도 표기("26.1") — 연도 없는 'M월' 충돌(2025-01 vs 2026-01) 방지.
 * latest < START 이거나 비면 START 단일 월만.
 */
export function buildFlowMonths(latest: string | null | undefined): FlowMonth[] {
  const start = FLOW_AXIS_START
  const end = latest && latest >= start ? latest : start
  const months: string[] = []
  let [y, m] = start.split('-').map(Number)
  const [ly, lm] = end.split('-').map(Number)
  while (y < ly || (y === ly && m <= lm)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  const multiYear = new Set(months.map((mm) => mm.slice(0, 4))).size > 1
  return months.map((mm) => ({
    month: mm,
    label: multiYear ? `${mm.slice(2, 4)}.${parseInt(mm.slice(5), 10)}` : flowLabel(mm),
    incomplete: FLOW_INCOMPLETE.has(mm),
  }))
}

// 월별 퍼널별 흐름 — sales_monthly_flow_funnel. monthly_flow(총계)에 funnel 차원 추가분.
// 퍼널 합 = sales_monthly_flow 총계 (aggregate.monthly_flow_by_funnel invariant).
export interface MonthlyFlowFunnel {
  month: string // 'YYYY-MM'
  funnel: string
  intake: number
  contracted: number
}

// 월간통계(Obsidian dataviewjs)와 동일한 퍼널 순서·색 — 대표님이 본 화면과 일치시키기 위함.
export const FUNNEL_ORDER = [
  '크리에이터 경유', '경영진 네트워크', '홈페이지', '아웃바운드', '레퍼럴', '기존 고객사',
] as const

export const FUNNEL_COLOR: Record<string, string> = {
  '크리에이터 경유': '#36a2eb',
  '경영진 네트워크': '#ffce56',
  홈페이지: '#ff6384',
  아웃바운드: '#9966ff',
  레퍼럴: '#4bc0c0',
  '기존 고객사': '#ff9f40',
  '(없음)': '#9ca3af',
}

export const funnelColor = (f: string): string => FUNNEL_COLOR[f] ?? '#9ca3af'

/** sales_monthly_flow_funnel 조회 (월 오름차순). */
export async function fetchMonthlyFlowFunnel(): Promise<MonthlyFlowFunnel[]> {
  const { data, error } = await supabase
    .from('sales_monthly_flow_funnel')
    .select('*')
    .order('month', { ascending: true })
  if (error) {
    console.error('[fetchMonthlyFlowFunnel] 조회 실패:', error.message)
    return []
  }
  return (data ?? []).map((r) => ({
    month: r.month ?? '',
    funnel: r.funnel ?? '(없음)',
    intake: Number(r.intake ?? 0),
    contracted: Number(r.contracted ?? 0),
  }))
}

export interface FunnelPivot {
  funnels: string[]
  data: Record<string, number | string>[]
}

/**
 * 퍼널 흐름을 Recharts stacked bar 용으로 피벗.
 * axis = buildFlowMonths() 결과(총계 차트와 동일 축). axis 밖 월(2025 sparse 등)은 제외 →
 * 두 차트 x축·라벨 일치, 연도 충돌 없음. FUNNEL_ORDER 밖 funnel 값은 '(없음)'으로 흡수해
 * 막대 합 == 총계 invariant 유지(드롭 금지). 해당 metric 이 한 번도 양수가 아닌 funnel 은 키에서 제외.
 */
export function pivotFunnelFlow(
  rows: MonthlyFlowFunnel[],
  metric: 'intake' | 'contracted',
  axis: FlowMonth[],
): FunnelPivot {
  const known = new Set<string>([...FUNNEL_ORDER, '(없음)'])
  const axisMonths = new Set(axis.map((a) => a.month))
  const present = new Set<string>()
  const cell: Record<string, Record<string, number>> = {}
  for (const r of rows) {
    if (!axisMonths.has(r.month)) continue // 축 밖(2025 등) 제외
    const f = known.has(r.funnel) ? r.funnel : '(없음)' // 미지 funnel → (없음) 흡수
    if (r[metric] > 0) present.add(f)
    cell[r.month] = cell[r.month] || {}
    cell[r.month][f] = (cell[r.month][f] || 0) + r[metric]
  }
  const funnels = [...FUNNEL_ORDER, '(없음)'].filter((f) => present.has(f))
  const data = axis.map(({ month, label }) => {
    const row: Record<string, number | string> = { label, month }
    for (const f of funnels) row[f] = cell[month]?.[f] ?? 0
    return row
  })
  return { funnels, data }
}

/** KRW 정수 → 보드 표기 (Python fmt_krw 와 동일 규칙). */
export function fmtKrw(n: number | null | undefined): string {
  if (!n || n <= 0) return '0'
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(1).replace(/\.0$/, '') + '억'
  return Math.round(n / 10_000).toLocaleString('ko-KR') + '만'
}

/** 예산 표기 문자열 → 정렬용 근사 KRW (범위 중간값, 억/천만/만 단위). 파싱 불가 0. */
export function budgetKrw(s: string | null | undefined): number {
  if (!s) return 0
  const t = s.replace(/\([^)]*\)/g, '')
  const unit: Record<string, number> = { 억: 1e8, 천만: 1e7, 만: 1e4 }
  const vals: number[] = []
  const re = /(\d[\d,]*(?:\.\d+)?)\s*(억|천만|만)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(t))) vals.push(parseFloat(m[1].replace(/,/g, '')) * unit[m[2]])
  if (!vals.length) return 0
  if (t.includes('~') && vals.length >= 2) return (vals[0] + vals[1]) / 2
  if (t.includes('+')) return vals.reduce((a, b) => a + b, 0)
  return vals[0]
}

/** 'YYYY-MM' → 'M월'. */
export function monthKr(ym: string | null | undefined): string {
  if (!ym || !ym.includes('-')) return ''
  const m = parseInt(ym.split('-')[1], 10)
  return Number.isFinite(m) && m >= 1 && m <= 12 ? `${m}월` : ''
}

export interface MonthlyForecast {
  months: string[]
  byMonth: Record<string, { seon: number; jan: number; total: number }>
  grand: { seon: number; jan: number; total: number }
  forecastN: number
  undeterminedN: number
}

/**
 * 월별 예상 입금 집계 (rows → 월×선금/잔금).
 * 운영 중 선금은 seon_month==="기수령" 이라 forecast 에서 제외(이미 수령 가정).
 * undetermined row 는 제외.
 */
export function buildMonthly(rows: SalesLead[]): MonthlyForecast {
  const byMonth: Record<string, { seon: number; jan: number; total: number }> = {}
  let forecastN = 0
  let undeterminedN = 0
  const bump = (m: string, kind: 'seon' | 'jan', amt: number) => {
    if (!m || amt == null || amt <= 0) return
    byMonth[m] = byMonth[m] || { seon: 0, jan: 0, total: 0 }
    byMonth[m][kind] += amt
    byMonth[m].total += amt
  }
  for (const r of rows) {
    if (r.undetermined) {
      undeterminedN++
      continue
    }
    forecastN++
    if (r.seon_month && r.seon_month !== '기수령' && r.seon_krw) bump(r.seon_month, 'seon', r.seon_krw)
    if (r.jan_month && r.jan_krw) bump(r.jan_month, 'jan', r.jan_krw)
  }
  const months = Object.keys(byMonth).sort()
  const grand = months.reduce(
    (acc, m) => ({
      seon: acc.seon + byMonth[m].seon,
      jan: acc.jan + byMonth[m].jan,
      total: acc.total + byMonth[m].total,
    }),
    { seon: 0, jan: 0, total: 0 },
  )
  return { months, byMonth, grand, forecastN, undeterminedN }
}

/** 영업 정체 위험: 협상중/스톨 중 마지막 대응 14일+ 경과. */
export function daysSince(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00+09:00') // KST 달력 날짜 기준 (UTC now 와 비교 시 off-by-one 방지)
  if (Number.isNaN(d.getTime())) return null
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000)
}
