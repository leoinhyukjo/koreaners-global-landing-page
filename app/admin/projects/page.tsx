'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { fetchAllProjects, fetchExchangeRates } from '@/lib/dashboard/queries'
import { totalContractKrw, totalExpenseKrw, totalMarginKrw, marginRate, receivableKrw, FALLBACK_RATES, type Project, type ExchangeRates } from '@/lib/dashboard/calculations'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import {
  StatusBarChart,
  MonthlyBarChart,
  WorkloadBarChart,
} from '@/components/admin/dashboard/charts'
import { DashboardTabs } from '@/components/admin/dashboard/dashboard-tabs'

// Active statuses to collapse into "진행중"
const ACTIVE_STATUSES = new Set([
  '리스트업',
  '섭외 중',
  '검토 중',
  '진행 중',
  '클라이언트 정산 중',
  '인플루언서 정산 중',
])

const COMPLETED_STATUSES = new Set(['진행 완료'])

// Statuses to exclude from pipeline chart entirely
const EXCLUDE_STATUSES = new Set(['보류', '진행 전', '(미설정)'])

const NON_ACTIVE_STATUSES = new Set(['진행 완료', '진행 전', '보류'])

function getLast6Months(): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    result.push(`${yyyy}-${mm}`)
  }
  return result
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  async function loadData() {
    const [all, r] = await Promise.all([fetchAllProjects(), fetchExchangeRates()])
    setProjects(all)
    setRates(r)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/sync/projects', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSyncMsg(`${data.synced}건 동기화 완료`)
        await loadData()
      } else {
        setSyncMsg(data.error || '동기화 실패')
      }
    } catch {
      setSyncMsg('네트워크 오류')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 4000)
    }
  }

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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-800" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-lg bg-neutral-800" />
          ))}
        </div>
      </div>
    )
  }

  // KPI
  const totalProjects = projects.length
  const inProgress = projects.filter((p) => p.status && !NON_ACTIVE_STATUSES.has(p.status)).length
  const totalContract = projects.reduce((acc, p) => acc + totalContractKrw(p, rates), 0)
  const totalReceivable = projects.reduce((acc, p) => acc + receivableKrw(p, rates), 0)

  // 마진 — 계약금액 또는 지출액이 있는 프로젝트만
  const marginProjects = projects.filter((p) => totalContractKrw(p, rates) > 0 || totalExpenseKrw(p, rates) > 0)
  const avgMarginRate = marginProjects.length > 0
    ? marginProjects.reduce((acc, p) => acc + marginRate(p, rates), 0) / marginProjects.length
    : 0
  const totalExpense = projects.reduce((acc, p) => acc + totalExpenseKrw(p, rates), 0)
  const totalMargin = projects.reduce((acc, p) => acc + totalMarginKrw(p, rates), 0)

  // Status pipeline — 각 status별 건수 표시
  const pipelineMap = new Map<string, number>()
  for (const p of projects) {
    const s = p.status ?? '(미설정)'
    pipelineMap.set(s, (pipelineMap.get(s) ?? 0) + 1)
  }
  // 시트 드롭다운 순서대로 정렬
  const STATUS_ORDER = ['진행 전', '리스트업', '섭외 중', '검토 중', '진행 중', '클라이언트 정산 중', '인플루언서 정산 중', '진행 완료', '보류']
  const statusData = STATUS_ORDER
    .filter((s) => pipelineMap.has(s))
    .map((s) => ({ status: s, count: pipelineMap.get(s)! }))

  // Assignee workload
  // 담당자별 상태 집계
  const assigneeStatusMap = new Map<string, { active: number; completed: number; other: number }>()
  for (const p of projects) {
    for (const name of p.assignee_names) {
      const entry = assigneeStatusMap.get(name) ?? { active: 0, completed: 0, other: 0 }
      const s = p.status ?? ''
      if (COMPLETED_STATUSES.has(s)) entry.completed++
      else if (ACTIVE_STATUSES.has(s)) entry.active++
      else entry.other++
      assigneeStatusMap.set(name, entry)
    }
  }
  const workloadData = Array.from(assigneeStatusMap.entries())
    .map(([assignee, counts]) => ({ assignee, ...counts, total: counts.active + counts.completed + counts.other }))
    .sort((a, b) => b.total - a.total)

  // Monthly
  const last6 = getLast6Months()
  const monthlyMap = new Map<string, number>(last6.map((m) => [m, 0]))
  for (const p of projects) {
    if (!p.start_date) continue
    const month = p.start_date.slice(0, 7)
    if (monthlyMap.has(month)) {
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + totalContractKrw(p, rates))
    }
  }
  const monthlyData = last6.map((month) => ({
    month: month.slice(5),
    amount: monthlyMap.get(month) ?? 0,
  }))

  // Receivable TOP 10
  const receivableList = projects
    .map((p) => ({
      id: p.id,
      name: p.name,
      brand_name: p.brand_name,
      amount: receivableKrw(p, rates),
    }))
    .filter((p) => p.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

  const fmtKrw = (n: number) => {
    if (n >= 100_000_000) return `₩${(n / 100_000_000).toFixed(2)}억`
    if (n >= 10_000) return `₩${(n / 10_000).toFixed(2)}만`
    return `₩${Math.round(n).toLocaleString('ko-KR')}`
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
        <div className="flex items-center gap-2">
          {syncMsg && (
            <span className="text-xs text-neutral-400">{syncMsg}</span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '동기화 중...' : '시트 동기화'}
          </button>
        </div>
      </div>

      <DashboardTabs />

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <KpiCard title="총 프로젝트" value={`${totalProjects}개`} href="/admin/projects/detail?view=total" />
        <KpiCard title="활성 프로젝트" value={`${inProgress}개`} subtitle="완료·보류·진행전 제외" href="/admin/projects/detail?view=active" />
        <KpiCard title="총 계약금액" value={fmtKrw(totalContract)} href="/admin/projects/detail?view=contract" />
        <KpiCard
          title="미수금"
          value={fmtKrw(totalReceivable)}
          subtitle={`¥1=₩${rates.jpyToKrw} / $1=₩${rates.usdToKrw}`}
          href="/admin/projects/detail?view=receivable"
        />
        <Link href="/admin/projects/detail?view=margin" className="h-full">
          <div className="rounded-lg border bg-card p-4 sm:p-6 transition-colors flex flex-col justify-between h-full min-h-[100px] cursor-pointer hover:bg-neutral-800 hover:border-neutral-700">
            <p className="text-xs sm:text-sm text-muted-foreground">수익 현황</p>
            <div className="mt-2 space-y-1 text-xs sm:text-sm tabular-nums">
              <div className="flex justify-between"><span className="text-muted-foreground">계약</span><span className="font-medium">{fmtKrw(totalContract)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">비용</span><span className="font-medium">{fmtKrw(totalExpense)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">마진</span><span className="font-bold text-emerald-400">{fmtKrw(totalMargin)}</span></div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">마진율 {avgMarginRate.toFixed(1)}%</p>
          </div>
        </Link>
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 상태별 파이프라인 */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">상태별 파이프라인</h3>
          <StatusBarChart data={statusData} />
        </div>

        {/* 담당자별 프로젝트 수 */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">담당자별 프로젝트 수</h3>
          {workloadData.length > 0 ? (
            <WorkloadBarChart data={workloadData} />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">담당자 데이터가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 월별 계약금액 추이 */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">월별 계약금액 추이</h3>
          <MonthlyBarChart data={monthlyData} />
        </div>

        {/* 미수금 TOP 10 */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">미수금 TOP 10</h3>
          {receivableList.length === 0 ? (
            <p className="text-sm text-muted-foreground">미수금 항목이 없습니다.</p>
          ) : (
            <ol className="space-y-2">
              {receivableList.map((item, idx) => (
                <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 shrink-0 text-xs text-muted-foreground">{idx + 1}</span>
                    <span className="truncate">
                      {item.brand_name ? (
                        <span className="text-muted-foreground mr-1">[{item.brand_name}]</span>
                      ) : null}
                      {item.name}
                    </span>
                  </div>
                  <span className="shrink-0 font-medium text-primary">
                    {fmtKrw(item.amount)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
