import { supabase } from '@/lib/supabase/client'
import { CURRENCY_PAIRS, FALLBACK_RATES, type ExchangeRates, type Project } from './calculations'

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
    company_name: row.company_name ?? null,
    brand_name: row.brand_name ?? null,
    status: row.status ?? null,
    project_type: row.project_type ?? null,
    media: row.media ?? null,
    operation_sheet: row.operation_sheet ?? null,
    assignee_names: Array.isArray(row.assignee_names) ? row.assignee_names : [],
    assignee_sub: Array.isArray(row.assignee_sub) ? row.assignee_sub : [],
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    note: row.note ?? null,
    contract_krw: Number(row.contract_krw ?? 0),
    contract_jpy: Number(row.contract_jpy ?? 0),
    contract_usd: Number(row.contract_usd ?? 0),
    contract_cny: Number(row.contract_cny ?? 0),
    collab_fee: Number(row.collab_fee ?? 0),
    expense_krw: Number(row.expense_krw ?? 0),
    expense_jpy: Number(row.expense_jpy ?? 0),
    expense_cny: Number(row.expense_cny ?? 0),
    margin_krw: Number(row.margin_krw ?? 0),
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

/** 최신 환율 조회 (브라우저 클라이언트용 — anon key, RLS 통과). */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('currency_pair, rate')
      .in('currency_pair', [CURRENCY_PAIRS.JPY, CURRENCY_PAIRS.USD, CURRENCY_PAIRS.CNY])
      .order('rate_date', { ascending: false })

    if (error || !data?.length) {
      console.warn('[fetchExchangeRates] cache empty, using fallback:', error?.message)
      return FALLBACK_RATES
    }

    return {
      jpyToKrw: pickLatest(data, CURRENCY_PAIRS.JPY) ?? FALLBACK_RATES.jpyToKrw,
      usdToKrw: pickLatest(data, CURRENCY_PAIRS.USD) ?? FALLBACK_RATES.usdToKrw,
      cnyToKrw: pickLatest(data, CURRENCY_PAIRS.CNY) ?? FALLBACK_RATES.cnyToKrw,
    }
  } catch (err) {
    console.warn('[fetchExchangeRates] cache read failed, using fallback:', err)
    return FALLBACK_RATES
  }
}

function pickLatest(
  rows: Array<{ currency_pair: string; rate: number | string | null }>,
  pair: string,
): number | null {
  const row = rows.find((r) => r.currency_pair === pair)
  if (!row?.rate) return null
  const n = Number(row.rate)
  return Number.isFinite(n) && n > 0 ? n : null
}
