'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import {
  WorkloadBarChart,
  TrendLineChart,
} from '@/components/admin/dashboard/charts'
import {
  BrandAccordion,
  type BrandGroup,
} from '@/components/admin/dashboard/brand-accordion'
import { DashboardTabs } from '@/components/admin/dashboard/dashboard-tabs'
import {
  fetchAllProjects,
  fetchLatestExchangeRate,
} from '@/lib/dashboard/queries'
import {
  totalContractKrw,
  receivableKrw,
  projectDurationDays,
} from '@/lib/dashboard/calculations'
import type { Project } from '@/lib/dashboard/calculations'

// ────────────────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────────────────

function formatKrw(value: number): string {
  if (value === 0) return '₩0'
  if (value >= 100_000_000) {
    return `₩${(value / 100_000_000).toFixed(1)}억`
  }
  if (value >= 10_000) {
    return `₩${(value / 10_000).toFixed(0)}만`
  }
  return `₩${value.toLocaleString('ko-KR')}`
}

function toYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function recentMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push(ym)
  }
  return months
}

// ────────────────────────────────────────────────────────────
// 파생 데이터 계산
// ────────────────────────────────────────────────────────────

function useDerivedData(projects: Project[], jpyRate: number) {
  return useMemo(() => {
    const subProjects = projects.filter((p) => !!p.parent_notion_id)

    const totalContract = subProjects.reduce(
      (sum, p) => sum + totalContractKrw(p, jpyRate),
      0,
    )
    const totalReceivable = subProjects.reduce(
      (sum, p) => sum + receivableKrw(p, jpyRate),
      0,
    )
    const completedCount = subProjects.filter(
      (p) => p.status === '완료',
    ).length

    // Fix: avgDuration only counts completed projects with both dates
    const completedWithDates = subProjects.filter(
      (p) => p.status === '완료' && p.start_date && p.end_date,
    )
    const durations = completedWithDates
      .map((p) => projectDurationDays(p))
      .filter((d): d is number => d !== null)
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null

    const brandMap = new Map<string, Project[]>()
    for (const p of subProjects) {
      const key = p.brand_name ?? '(브랜드 미정)'
      const list = brandMap.get(key) ?? []
      list.push(p)
      brandMap.set(key, list)
    }
    const brandGroups: BrandGroup[] = Array.from(brandMap.entries())
      .map(([brandName, projs]) => ({
        brandName,
        projects: projs,
        totalContract: projs.reduce(
          (sum, p) => sum + totalContractKrw(p, jpyRate),
          0,
        ),
        totalReceivable: projs.reduce(
          (sum, p) => sum + receivableKrw(p, jpyRate),
          0,
        ),
      }))
      .sort((a, b) => b.totalContract - a.totalContract)

    const assigneeMap = new Map<string, number>()
    for (const p of subProjects) {
      for (const name of p.assignee_names) {
        assigneeMap.set(name, (assigneeMap.get(name) ?? 0) + 1)
      }
    }
    const workloadData = Array.from(assigneeMap.entries())
      .map(([assignee, count]) => ({ assignee, count }))
      .sort((a, b) => b.count - a.count)

    const months = recentMonths(6)
    const newCountMap = new Map<string, number>(months.map((m) => [m, 0]))
    const completedCountMap = new Map<string, number>(
      months.map((m) => [m, 0]),
    )
    for (const p of subProjects) {
      if (p.start_date) {
        const ym = toYearMonth(p.start_date)
        if (newCountMap.has(ym)) {
          newCountMap.set(ym, (newCountMap.get(ym) ?? 0) + 1)
        }
      }
      if (p.status === '완료' && p.end_date) {
        const ym = toYearMonth(p.end_date)
        if (completedCountMap.has(ym)) {
          completedCountMap.set(ym, (completedCountMap.get(ym) ?? 0) + 1)
        }
      }
    }
    const trendData = months.map((month) => ({
      month,
      new: newCountMap.get(month) ?? 0,
      completed: completedCountMap.get(month) ?? 0,
    }))

    return {
      subProjects,
      totalContract,
      totalReceivable,
      completedCount,
      avgDuration,
      brandGroups,
      workloadData,
      trendData,
    }
  }, [projects, jpyRate])
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export default function ProjectsReportPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [jpyRate, setJpyRate] = useState<number>(9.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [allProjects, rate] = await Promise.all([
          fetchAllProjects(),
          fetchLatestExchangeRate(),
        ])
        setProjects(allProjects)
        setJpyRate(rate)
      } catch (err) {
        console.error('[ReportDashboard] 데이터 로드 실패:', err)
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const {
    subProjects,
    totalContract,
    totalReceivable,
    completedCount,
    avgDuration,
    brandGroups,
    workloadData,
    trendData,
  } = useDerivedData(projects, jpyRate)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            어드민
          </Link>
        </div>
        <h1 className="text-lg font-semibold text-neutral-50">프로젝트 현황</h1>
        <DashboardTabs />
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          데이터를 불러오는 중...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            어드민
          </Link>
        </div>
        <h1 className="text-lg font-semibold text-neutral-50">프로젝트 현황</h1>
        <DashboardTabs />
        <div className="flex items-center justify-center py-20 text-red-400 text-sm">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          어드민
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-50">프로젝트 현황</h1>
      </div>

      <DashboardTabs />

      <div className="space-y-8">
        {/* KPI 카드 */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            핵심 지표
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              title="전체 계약금액"
              value={formatKrw(totalContract)}
              subtitle={`하위 프로젝트 ${subProjects.length}건`}
            />
            <KpiCard
              title="미수금"
              value={formatKrw(totalReceivable)}
              subtitle={totalReceivable > 0 ? '입금 대기 중' : '전액 입금 완료'}
            />
            <KpiCard
              title="완료 프로젝트"
              value={`${completedCount}건`}
              subtitle={
                subProjects.length > 0
                  ? `전체의 ${Math.round((completedCount / subProjects.length) * 100)}%`
                  : undefined
              }
            />
            <KpiCard
              title="평균 기간"
              value={avgDuration !== null ? `${avgDuration}일` : '—'}
              subtitle="완료 프로젝트 기준"
            />
          </div>
        </section>

        {/* 브랜드별 아코디언 */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            브랜드별 프로젝트 현황
          </h2>
          <BrandAccordion groups={brandGroups} jpyRate={jpyRate} />
        </section>

        {/* 담당자별 업무량 + 월간 트렌드 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              담당자별 업무량
            </h2>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              {workloadData.length > 0 ? (
                <WorkloadBarChart data={workloadData} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  담당자 데이터가 없습니다.
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              월간 트렌드 (최근 6개월)
            </h2>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <TrendLineChart data={trendData} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
