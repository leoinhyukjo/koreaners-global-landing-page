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
  fetchExchangeRates,
} from '@/lib/dashboard/queries'
import {
  totalContractKrw,
  receivableKrw,
  projectDurationDays,
  isSignedContract,
  isPendingContract,
  FALLBACK_RATES,
} from '@/lib/dashboard/calculations'
import type { Project, ExchangeRates } from '@/lib/dashboard/calculations'

// ────────────────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────────────────

// KPI 카드 표시는 억 단위 통일 (1억 미만은 소수점 2자리, 0 은 ₩0)
function formatKrw(value: number): string {
  if (value === 0) return '₩0'
  return `₩${(value / 100_000_000).toFixed(2)}억`
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

function useDerivedData(projects: Project[], rates: ExchangeRates) {
  return useMemo(() => {
    const subProjects = projects
    // 계약 체결건 / 체결 전 단계 분리 — financial 집계는 signed 만 기준
    const signedProjects = subProjects.filter(isSignedContract)
    const pendingProjects = subProjects.filter(isPendingContract)

    const totalContract = signedProjects.reduce(
      (sum, p) => sum + totalContractKrw(p, rates),
      0,
    )
    const totalReceivable = signedProjects.reduce(
      (sum, p) => sum + receivableKrw(p, rates),
      0,
    )
    const pendingContract = pendingProjects.reduce(
      (sum, p) => sum + totalContractKrw(p, rates),
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

    // 브랜드별 집계 — 체결건만 대상
    const brandMap = new Map<string, Project[]>()
    for (const p of signedProjects) {
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
          (sum, p) => sum + totalContractKrw(p, rates),
          0,
        ),
        totalReceivable: projs.reduce(
          (sum, p) => sum + receivableKrw(p, rates),
          0,
        ),
      }))
      .sort((a, b) => b.totalContract - a.totalContract)

    const REPORT_ACTIVE = new Set(['리스트업', '섭외 중', '검토 중', '진행 중', '클라이언트 정산 중', '인플루언서 정산 중'])
    const REPORT_COMPLETED = new Set(['진행 완료'])
    const assigneeStatusMap = new Map<string, { active: number; completed: number; other: number }>()
    for (const p of subProjects) {
      for (const name of p.assignee_names) {
        const entry = assigneeStatusMap.get(name) ?? { active: 0, completed: 0, other: 0 }
        const s = p.status ?? ''
        if (REPORT_COMPLETED.has(s)) entry.completed++
        else if (REPORT_ACTIVE.has(s)) entry.active++
        else entry.other++
        assigneeStatusMap.set(name, entry)
      }
    }
    const workloadData = Array.from(assigneeStatusMap.entries())
      .map(([assignee, counts]) => ({ assignee, ...counts, total: counts.active + counts.completed + counts.other }))
      .sort((a, b) => b.total - a.total)

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
      signedCount: signedProjects.length,
      pendingCount: pendingProjects.length,
      totalContract,
      totalReceivable,
      pendingContract,
      completedCount,
      avgDuration,
      brandGroups,
      workloadData,
      trendData,
    }
  }, [projects, rates])
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export default function ProjectsReportPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [allProjects, rate] = await Promise.all([
          fetchAllProjects(),
          fetchExchangeRates(),
        ])
        setProjects(allProjects)
        setRates(rate)
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
    signedCount,
    pendingCount,
    totalContract,
    totalReceivable,
    pendingContract,
    completedCount,
    avgDuration,
    brandGroups,
    workloadData,
    trendData,
  } = useDerivedData(projects, rates)

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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard
              title="전체 계약금액"
              value={formatKrw(totalContract)}
              subtitle={`체결 ${signedCount}건`}
            />
            <KpiCard
              title="예상 계약 대기"
              value={formatKrw(pendingContract)}
              subtitle={`${pendingCount}건 · 계약서 전`}
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
          <BrandAccordion groups={brandGroups} rates={rates} />
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
