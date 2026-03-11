export interface Project {
  id: string
  notion_id: string
  name: string
  parent_notion_id: string | null
  brand_name: string | null
  status: string | null
  priority: string | null
  team: string[]
  project_type: string[]
  assignee_names: string[]
  contract_krw: number
  contract_jpy: number
  advance_payment_krw: number
  advance_payment_jpy: number
  creator_settlement_krw: number
  creator_settlement_jpy: number
  client_settlement: string | null
  creator_settlement_status: string | null
  contract_status: string | null
  estimate_status: string | null
  tax_invoice_status: string | null
  start_date: string | null
  end_date: string | null
  note: string | null
  influencer_info: string | null
  settlement_progress: string | null
}

/** 계약 총액을 KRW로 환산 (JPY → KRW 변환 포함) */
export function totalContractKrw(p: Project, jpyRate: number): number {
  return p.contract_krw + p.contract_jpy * jpyRate
}

/** 선금 총액을 KRW로 환산 */
export function totalAdvanceKrw(p: Project, jpyRate: number): number {
  return p.advance_payment_krw + p.advance_payment_jpy * jpyRate
}

/**
 * 미수금 (KRW 기준)
 * - client_settlement === '입금 완료' → 0
 * - 그 외 → 계약 총액 - 선금
 */
export function receivableKrw(p: Project, jpyRate: number): number {
  if (p.client_settlement === '입금 완료') return 0
  const total = totalContractKrw(p, jpyRate)
  const advance = totalAdvanceKrw(p, jpyRate)
  return Math.max(0, total - advance)
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
