import { supabase } from '@/lib/supabase/client'
import type { Project } from './calculations'

/** 전체 프로젝트 목록 조회 (클라이언트 전용) */
export async function fetchAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[fetchAllProjects] 조회 실패:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id ?? '',
    row_code: row.row_code ?? '',
    name: row.brand_name || row.company_name || row.row_code || '',
    entry_date: row.entry_date ?? null,
    week_code: row.week_code ?? null,
    company_name: row.company_name ?? null,
    brand_name: row.brand_name ?? null,
    status: row.status ?? null,
    project_type: row.project_type ?? null,
    media: row.media ?? null,
    assignee_names: Array.isArray(row.assignee_names) ? row.assignee_names : [],
    assignee_sub: Array.isArray(row.assignee_sub) ? row.assignee_sub : [],
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    note: row.note ?? null,
    contract_krw: Number(row.contract_krw ?? 0),
    contract_jpy: Number(row.contract_jpy ?? 0),
    collab_fee: Number(row.collab_fee ?? 0),
    expense_krw: Number(row.expense_krw ?? 0),
    expense_jpy: Number(row.expense_jpy ?? 0),
    margin_krw: Number(row.margin_krw ?? 0),
    margin_jpy: Number(row.margin_jpy ?? 0),
    estimate_status: row.estimate_status ?? null,
    contract_status: row.contract_status ?? null,
    contract_date: row.contract_date ?? null,
    settlement_due_date: row.settlement_due_date ?? null,
    advance_paid_date: row.advance_paid_date ?? null,
    balance_paid_date: row.balance_paid_date ?? null,
    contract_cost: Number(row.contract_cost ?? 0),
    tax_invoice_date: row.tax_invoice_date ?? null,
    payment_status: row.payment_status ?? null,
    remittance_status: row.remittance_status ?? null,
    creator_settlement_note: row.creator_settlement_note ?? null,
  })) as Project[]
}

/**
 * 최신 JPY/KRW 환율 조회
 * exchange_rates 테이블에서 가장 최근 레코드 사용.
 * 실패 시 폴백: 9.0
 */
export async function fetchLatestExchangeRate(): Promise<number> {
  const FALLBACK_RATE = 9.0

  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('currency_pair', 'JPY/KRW')
      .order('rate_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      console.warn('[fetchLatestExchangeRate] 조회 실패, 폴백 사용:', error?.message)
      return FALLBACK_RATE
    }

    const rate = Number(data.rate)
    return isNaN(rate) || rate <= 0 ? FALLBACK_RATE : rate
  } catch (err) {
    console.warn('[fetchLatestExchangeRate] 예외 발생, 폴백 사용:', err)
    return FALLBACK_RATE
  }
}
