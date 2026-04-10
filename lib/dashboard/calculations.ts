export interface ExchangeRates {
  jpyToKrw: number
  usdToKrw: number
}

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
  collab_fee: number
  expense_krw: number
  expense_jpy: number
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

/** 계약 총액을 KRW로 환산 (3통화 합산) */
export function totalContractKrw(p: Project, rates: ExchangeRates): number {
  return p.contract_krw + p.contract_jpy * rates.jpyToKrw + p.contract_usd * rates.usdToKrw
}

/** 지출액 총액을 KRW로 환산 */
export function totalExpenseKrw(p: Project, rates: ExchangeRates): number {
  return p.expense_krw + p.expense_jpy * rates.jpyToKrw
}

/** 마진 총액 (시트에서 이미 원화 환산) */
export function totalMarginKrw(p: Project): number {
  return p.margin_krw
}

/** 마진율 (%). 계약금액이 0이면 0 반환 */
export function marginRate(p: Project, rates: ExchangeRates): number {
  const contract = totalContractKrw(p, rates)
  if (contract === 0) return 0
  return (totalMarginKrw(p) / contract) * 100
}

/**
 * 미수금 (KRW 기준)
 * - payment_status에 '잔금 입금 완료' 포함 → 0
 * - 그 외 → 계약 총액 전액
 */
export function receivableKrw(p: Project, rates: ExchangeRates): number {
  if (p.payment_status?.includes('잔금 입금 완료')) return 0
  return totalContractKrw(p, rates)
}

/** 프로젝트 기간 (일수). start_date 또는 end_date가 없으면 null */
export function projectDurationDays(p: Project): number | null {
  if (!p.start_date || !p.end_date) return null
  const start = new Date(p.start_date).getTime()
  const end = new Date(p.end_date).getTime()
  const diffMs = end - start
  if (isNaN(diffMs) || diffMs < 0) return null
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}
