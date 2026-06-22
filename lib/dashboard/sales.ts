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

// 추세(시간축) 스냅샷 — sales_snapshots, 하루 1행 적재.
export interface SalesSnapshot {
  snapshot_date: string // ISO date
  negotiating: number
  contracted: number
  operating: number
  stall: number
  at_risk: number
  forecast_total: number
  forecast_n: number
}

/** sales_snapshots 전체 조회 (날짜 오름차순, anon client + 로그인 세션). */
export async function fetchSnapshots(): Promise<SalesSnapshot[]> {
  const { data, error } = await supabase
    .from('sales_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: true })
  if (error) {
    console.error('[fetchSnapshots] 조회 실패:', error.message)
    return []
  }
  return (data ?? []).map((r) => ({
    snapshot_date: r.snapshot_date ?? '',
    negotiating: Number(r.negotiating ?? 0),
    contracted: Number(r.contracted ?? 0),
    operating: Number(r.operating ?? 0),
    stall: Number(r.stall ?? 0),
    at_risk: Number(r.at_risk ?? 0),
    forecast_total: r.forecast_total == null ? 0 : Number(r.forecast_total),
    forecast_n: Number(r.forecast_n ?? 0),
  }))
}

export interface TrendPoint {
  date: string // 'M/D'
  negotiating: number
  contracted: number
  operating: number
  stall: number
  at_risk: number
  forecast_total: number
}

/** 스냅샷 → 차트용 포인트 (날짜 'M/D' 라벨). */
export function snapshotPoints(snaps: SalesSnapshot[]): TrendPoint[] {
  return snaps.map((s) => {
    const parts = s.snapshot_date.split('-')
    const label = parts.length === 3 ? `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}` : s.snapshot_date
    return {
      date: label,
      negotiating: s.negotiating,
      contracted: s.contracted,
      operating: s.operating,
      stall: s.stall,
      at_risk: s.at_risk,
      forecast_total: s.forecast_total,
    }
  })
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
