import { supabase } from '@/lib/supabase/client'

// BD 통합 엔티티 마스터 (bd_entity_summary / bd_unified 뷰). 브랜드 grain.
// SoT = Supabase bd_entities + entity_id FK 스탬프(contracts/projects/sales_leads).

export interface EntitySummary {
  entity_id: string
  canonical_name: string
  entity_type: string // brand / agency
  industry: string | null
  deal_count: number
  total_krw: number
  total_jpy: number
  first_deal: string | null
  last_deal: string | null
  agency_count: number
  lead_count: number
}

export async function fetchEntitySummary(): Promise<EntitySummary[]> {
  const { data, error } = await supabase.from('bd_entity_summary').select('*')
  if (error) {
    console.error('[fetchEntitySummary] 조회 실패:', error.message)
    return []
  }
  return (data ?? []).map((r) => ({
    entity_id: r.entity_id ?? '',
    canonical_name: r.canonical_name ?? '',
    entity_type: r.entity_type ?? 'brand',
    industry: r.industry ?? null,
    deal_count: Number(r.deal_count ?? 0),
    total_krw: Number(r.total_krw ?? 0),
    total_jpy: Number(r.total_jpy ?? 0),
    first_deal: r.first_deal ?? null,
    last_deal: r.last_deal ?? null,
    agency_count: Number(r.agency_count ?? 0),
    lead_count: Number(r.lead_count ?? 0),
  }))
}

export interface UnifiedDeal {
  entity_id: string
  unique_code: string | null
  deal_agency: string | null
  currency: string | null
  total_krw: number | null
  total_jpy: number | null
  contract_date: string | null
  ops_status: string | null
  media: string | null
}

/** 특정 엔티티의 딜 명세 (bd_unified). 행 확장 시 조회. */
export async function fetchEntityDeals(entityId: string): Promise<UnifiedDeal[]> {
  const { data, error } = await supabase
    .from('bd_unified')
    .select('entity_id,unique_code,deal_agency,currency,total_krw,total_jpy,contract_date,ops_status,media')
    .eq('entity_id', entityId)
    .order('contract_date', { ascending: false })
  if (error) {
    console.error('[fetchEntityDeals] 조회 실패:', error.message)
    return []
  }
  return (data ?? []) as UnifiedDeal[]
}
