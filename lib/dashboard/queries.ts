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
    notion_id: row.notion_id ?? '',
    name: row.name ?? '',
    parent_notion_id: row.parent_notion_id ?? null,
    brand_name: row.brand_name ?? null,
    status: row.status ?? null,
    priority: row.priority ?? null,
    team: Array.isArray(row.team) ? row.team : [],
    project_type: Array.isArray(row.project_type) ? row.project_type : [],
    assignee_names: Array.isArray(row.assignee_names) ? row.assignee_names : [],
    contract_krw: Number(row.contract_krw ?? 0),
    contract_jpy: Number(row.contract_jpy ?? 0),
    advance_payment_krw: Number(row.advance_payment_krw ?? 0),
    advance_payment_jpy: Number(row.advance_payment_jpy ?? 0),
    creator_settlement_krw: Number(row.creator_settlement_krw ?? 0),
    creator_settlement_jpy: Number(row.creator_settlement_jpy ?? 0),
    client_settlement: row.client_settlement ?? null,
    creator_settlement_status: row.creator_settlement_status ?? null,
    contract_status: row.contract_status ?? null,
    estimate_status: row.estimate_status ?? null,
    tax_invoice_status: row.tax_invoice_status ?? null,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    note: row.note ?? null,
    influencer_info: row.influencer_info ?? null,
    settlement_progress: row.settlement_progress ?? null,
  })) as Project[]
}

/**
 * 최신 JPY/KRW 환율 조회
 * exchange_rates 테이블의 가장 최근 레코드 사용.
 * 실패 시 폴백: 9.0
 */
export async function fetchLatestExchangeRate(): Promise<number> {
  const FALLBACK_RATE = 9.0

  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('jpy_to_krw')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.warn('[fetchLatestExchangeRate] 조회 실패, 폴백 사용:', error?.message)
      return FALLBACK_RATE
    }

    const rate = Number(data.jpy_to_krw)
    return isNaN(rate) || rate <= 0 ? FALLBACK_RATE : rate
  } catch (err) {
    console.warn('[fetchLatestExchangeRate] 예외 발생, 폴백 사용:', err)
    return FALLBACK_RATE
  }
}
