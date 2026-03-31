export interface Project {
  id: string
  row_code: string
  name: string
  entry_date: string | null
  week_code: string | null
  company_name: string | null
  brand_name: string | null
  status: string | null
  project_type: string | null
  media: string | null
  assignee_names: string[]
  assignee_sub: string[]
  start_date: string | null
  end_date: string | null
  note: string | null
  contract_krw: number
  contract_jpy: number
  collab_fee: number
  expense_krw: number
  expense_jpy: number
  margin_krw: number
  margin_jpy: number
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

/** 계약 총액을 KRW로 환산 (JPY → KRW 변환 포함) */
export function totalContractKrw(p: Project, jpyRate: number): number {
  return p.contract_krw + p.contract_jpy * jpyRate
}

/** 지출액 총액을 KRW로 환산 */
export function totalExpenseKrw(p: Project, jpyRate: number): number {
  return p.expense_krw + p.expense_jpy * jpyRate
}

/** 마진 총액을 KRW로 환산 (시트의 원마진 + 엔마진 × 환율) */
export function totalMarginKrw(p: Project, jpyRate: number): number {
  return p.margin_krw + p.margin_jpy * jpyRate
}

/** 마진율 (%). 계약금액이 0이면 0 반환 */
export function marginRate(p: Project, jpyRate: number): number {
  const contract = totalContractKrw(p, jpyRate)
  if (contract === 0) return 0
  return (totalMarginKrw(p, jpyRate) / contract) * 100
}

/**
 * 미수금 (KRW 기준)
 * - payment_status에 '잔금 입금 완료' 포함 → 0
 * - 그 외 → 계약 총액 전액
 */
export function receivableKrw(p: Project, jpyRate: number): number {
  if (p.payment_status?.includes('잔금 입금 완료')) return 0
  return totalContractKrw(p, jpyRate)
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

// ─── Campaign Insights Types ──────────────────────────────────

export interface CampaignPostRow {
  brand_name: string
  creator_name: string | null
  ig_handle: string | null
  post_url: string
  post_type: string | null
  views: number
  likes: number
  shares: number
  comments: number
  collected_at: string | null
  campaign_code: string | null
}

export interface CampaignFinancialRow {
  campaign_code: string
  brand_name: string
  contract_amount_krw: number
  cost_krw: number
  margin_krw: number
  status: string
  start_date: string | null
  end_date: string | null
  pm_primary: string | null
  campaign_type?: string | null
  media?: string | null
}

// ─── Campaign Insight Functions ───────────────────────────────

export function engagementRate(post: CampaignPostRow): number {
  const engagement = post.likes + post.shares + post.comments
  return post.views > 0 ? (engagement / post.views) * 100 : 0
}

export function cpv(contractKrw: number, totalViews: number): number {
  return totalViews > 0 ? contractKrw / totalViews : 0
}

export function cpe(contractKrw: number, totalEngagement: number): number {
  return totalEngagement > 0 ? contractKrw / totalEngagement : 0
}

export function aggregateByCreator(posts: CampaignPostRow[]) {
  const map = new Map<string, {
    handle: string
    name: string
    views: number
    engagement: number
    postCount: number
  }>()
  for (const p of posts) {
    const key = p.ig_handle ?? p.creator_name ?? 'unknown'
    const existing = map.get(key) ?? {
      handle: key,
      name: p.creator_name ?? key,
      views: 0,
      engagement: 0,
      postCount: 0,
    }
    existing.views += p.views
    existing.engagement += p.likes + p.shares + p.comments
    existing.postCount += 1
    map.set(key, existing)
  }
  return Array.from(map.values()).sort((a, b) => b.views - a.views)
}

export function aggregateByBrand(
  posts: CampaignPostRow[],
  financials: CampaignFinancialRow[],
) {
  const finMap = new Map(financials.map((f) => [f.brand_name, f]))
  const postMap = new Map<string, {
    brand: string
    totalViews: number
    totalEngagement: number
    postCount: number
    contractKrw: number
    marginKrw: number
  }>()
  for (const p of posts) {
    const existing = postMap.get(p.brand_name) ?? {
      brand: p.brand_name,
      totalViews: 0,
      totalEngagement: 0,
      postCount: 0,
      contractKrw: finMap.get(p.brand_name)?.contract_amount_krw ?? 0,
      marginKrw: finMap.get(p.brand_name)?.margin_krw ?? 0,
    }
    existing.totalViews += p.views
    existing.totalEngagement += p.likes + p.shares + p.comments
    existing.postCount += 1
    postMap.set(p.brand_name, existing)
  }
  return Array.from(postMap.values()).sort((a, b) => b.totalViews - a.totalViews)
}
