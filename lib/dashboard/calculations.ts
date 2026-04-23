export interface ExchangeRates {
  jpyToKrw: number
  usdToKrw: number
  cnyToKrw: number
}

/** Supabase 캐시가 비어있을 때만 사용. 외부 launchd가 실패하는 동안의 임시 안전망 — 2026-04 기준 근사치. */
export const FALLBACK_RATES: ExchangeRates = {
  jpyToKrw: 9.3,
  usdToKrw: 1450.0,
  cnyToKrw: 200.0,
}

export const CURRENCY_PAIRS = {
  JPY: 'JPY/KRW',
  USD: 'USD/KRW',
  CNY: 'CNY/KRW',
} as const

export type CurrencyPair = (typeof CURRENCY_PAIRS)[keyof typeof CURRENCY_PAIRS]

export interface Project {
  id: string
  row_code: string
  name: string
  company_name: string | null
  brand_name: string | null
  status: string | null
  project_type: string | null
  media: string | null
  operation_sheet: string | null
  assignee_names: string[]
  assignee_sub: string[]
  start_date: string | null
  end_date: string | null
  note: string | null
  contract_krw: number
  contract_jpy: number
  contract_usd: number
  contract_cny: number
  collab_fee: number
  expense_krw: number
  expense_jpy: number
  expense_cny: number
  /**
   * 시트 '마진(원으로 적용)' 칼럼 원본값 (마케팅팀 수동 입력, 정확도 낮음).
   * 대시보드 계산에서는 사용하지 않음 - totalMarginKrw() 참조.
   */
  margin_krw: number
  estimate_status: string | null
  contract_status: string | null
  contract_date: string | null
  settlement_due_date: string | null
  advance_paid_date: string | null
  balance_paid_date: string | null
  contract_cost: number
  tax_invoice_date: string | null
  payment_status: string | null
  remittance_status: string | null
  creator_settlement_note: string | null
}

/**
 * 시트 status 를 financial 집계용 3 버킷으로 분류:
 *   SIGNED   = 진행 중 ~ 진행 완료 구간 → 총 계약금액/미수금/수익(계약·비용·마진) 집계 대상
 *   PENDING  = 진행 전 ~ 검토 중 구간    → "예상 계약 대기금액" 버킷 (계약서 전)
 *   EXCLUDED = 보류, Drop                → 어느 집계에도 포함 X
 *
 * '보류' 는 계약 진행이 중단된 상태라 signed 에도 pending 에도 속하지 않음.
 * 상태 미설정 (null/empty) 은 안전하게 어디에도 포함하지 않음.
 */
export const PENDING_CONTRACT_STATUSES = new Set([
  '진행 전',
  '리스트업',
  '섭외 중',
  '검토 중',
])

export const SIGNED_CONTRACT_STATUSES = new Set([
  '진행 중',
  '클라이언트 정산 중',
  '인플루언서 정산 중',
  '진행 완료',
])

/** 보류 / Drop — 금전 집계에서 완전히 제외. */
export const EXCLUDED_FROM_FINANCIALS = new Set(['보류', 'Drop'])

/** 진행 중 ~ 진행 완료 구간 (계약 체결 후). */
export function isSignedContract(p: Project): boolean {
  const s = p.status ?? ''
  return SIGNED_CONTRACT_STATUSES.has(s)
}

/** 진행 전 ~ 검토 중 구간 (계약서 체결 전, 예상 계약 대기금액). */
export function isPendingContract(p: Project): boolean {
  const s = p.status ?? ''
  return PENDING_CONTRACT_STATUSES.has(s)
}

export function totalContractKrw(p: Project, rates: ExchangeRates): number {
  return (
    p.contract_krw +
    p.contract_jpy * rates.jpyToKrw +
    p.contract_usd * rates.usdToKrw +
    p.contract_cny * rates.cnyToKrw
  )
}

/** 지출엔 USD 칼럼 없음 (시트 구조). */
export function totalExpenseKrw(p: Project, rates: ExchangeRates): number {
  return (
    p.expense_krw +
    p.expense_jpy * rates.jpyToKrw +
    p.expense_cny * rates.cnyToKrw
  )
}

/**
 * 마진 = 계약총액 - 지출총액. 시트의 margin_krw 칼럼(마케팅팀 수동 입력)은
 * 콜라보 수수료 텍스트 오염이 있어 사용하지 않고 환율 기반으로 재계산한다.
 */
export function totalMarginKrw(p: Project, rates: ExchangeRates): number {
  return totalContractKrw(p, rates) - totalExpenseKrw(p, rates)
}

export function marginRate(p: Project, rates: ExchangeRates): number {
  const contract = totalContractKrw(p, rates)
  if (contract === 0) return 0
  const margin = contract - totalExpenseKrw(p, rates)
  return (margin / contract) * 100
}

/** payment_status에 '잔금 입금 완료' 포함시 0, 아니면 계약 총액 전액. */
export function receivableKrw(p: Project, rates: ExchangeRates): number {
  if (p.payment_status?.includes('잔금 입금 완료')) return 0
  return totalContractKrw(p, rates)
}

export function projectDurationDays(p: Project): number | null {
  if (!p.start_date || !p.end_date) return null
  const start = new Date(p.start_date).getTime()
  const end = new Date(p.end_date).getTime()
  const diffMs = end - start
  if (isNaN(diffMs) || diffMs < 0) return null
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}
