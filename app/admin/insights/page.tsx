'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, TrendingUp, Users, DollarSign } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { fetchCampaignPosts, fetchCampaignFinancials } from '@/lib/dashboard/queries'
import type { CampaignPostRow, CampaignFinancialRow } from '@/lib/dashboard/calculations'
import { CampaignTable } from './components/campaign-table'
import { CreatorReport } from './components/creator-report'
import { TrendCharts } from './components/trend-charts'

type Tab = 'campaign' | 'creator' | 'trend'

const TABS: { id: Tab; label: string }[] = [
  { id: 'campaign', label: '캠페인' },
  { id: 'creator', label: '크리에이터' },
  { id: 'trend', label: '트렌드' },
]

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">{title}</p>
          <p className="text-xl font-semibold text-neutral-50">{value}</p>
        </div>
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

export default function InsightsPage() {
  const [posts, setPosts] = useState<CampaignPostRow[]>([])
  const [financials, setFinancials] = useState<CampaignFinancialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('campaign')

  useEffect(() => {
    // createBrowserClient를 컴포넌트 내부에서 초기화 (SSR 안전)
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key',
    )

    async function load() {
      try {
        const [p, f] = await Promise.all([
          fetchCampaignPosts(),
          fetchCampaignFinancials(),
        ])
        setPosts(p as CampaignPostRow[])
        setFinancials(f as CampaignFinancialRow[])
      } catch (err) {
        console.error('[InsightsPage] 데이터 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // KPI 집계
  const totalViews = posts.reduce((acc, p) => acc + p.views, 0)
  const totalRevenue = financials.reduce((acc, f) => acc + f.contract_amount_krw, 0)
  const totalMargin = financials.reduce((acc, f) => acc + f.margin_krw, 0)
  const uniqueCreators = new Set(
    posts.map((p) => p.ig_handle ?? p.creator_name ?? 'unknown'),
  ).size

  const fmtKrw = (n: number) =>
    n >= 100_000_000
      ? `₩${(n / 100_000_000).toFixed(1)}억`
      : n >= 10_000
      ? `₩${(n / 10_000).toFixed(0)}만`
      : `₩${n.toLocaleString('ko-KR')}`

  const fmtViews = (n: number) =>
    n >= 10_000 ? `${(n / 10_000).toFixed(1)}만` : n.toLocaleString('ko-KR')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            어드민
          </Link>
        </div>
        <h1 className="text-lg font-semibold text-neutral-50">캠페인 인사이트</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-800" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-neutral-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          어드민
        </Link>
      </div>

      <h1 className="text-lg font-semibold text-neutral-50">캠페인 인사이트</h1>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          title="총 조회수"
          value={fmtViews(totalViews)}
          icon={Eye}
          accent="bg-orange-500/10 border border-orange-500/20 text-orange-400"
        />
        <KpiCard
          title="총 매출"
          value={fmtKrw(totalRevenue)}
          icon={DollarSign}
          accent="bg-sky-500/10 border border-sky-500/20 text-sky-400"
        />
        <KpiCard
          title="총 마진"
          value={fmtKrw(totalMargin)}
          icon={TrendingUp}
          accent="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
        />
        <KpiCard
          title="크리에이터 수"
          value={`${uniqueCreators}명`}
          icon={Users}
          accent="bg-purple-500/10 border border-purple-500/20 text-purple-400"
        />
      </div>

      {/* 탭 */}
      <div className="border-b border-neutral-800">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'campaign' && (
        <CampaignTable financials={financials} posts={posts} />
      )}
      {activeTab === 'creator' && (
        <CreatorReport posts={posts} />
      )}
      {activeTab === 'trend' && (
        <TrendCharts financials={financials} />
      )}
    </div>
  )
}
