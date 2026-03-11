'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { fetchAllProjects, fetchLatestExchangeRate } from '@/lib/dashboard/queries'
import { totalContractKrw, totalCreatorSettlementKrw, marginKrw, marginRate, receivableKrw, type Project } from '@/lib/dashboard/calculations'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import {
  StatusBarChart,
  MonthlyLineChart,
  WorkloadBarChart,
} from '@/components/admin/dashboard/charts'
import { DashboardTabs } from '@/components/admin/dashboard/dashboard-tabs'

// Active statuses to collapse into "진행중"
const ACTIVE_STATUSES = new Set([
  '진행 중',
  '검토 중',
  '인플루언서 정산 중',
  '클라이언트 정산 중',
  '리스트업 중',
  '인플루언서 섭외',
  '리스트 전달',
])

// Statuses to exclude from pipeline chart entirely
const EXCLUDE_STATUSES = new Set(['Drop', '보류', '시작 전', '(미설정)'])

const NON_ACTIVE_STATUSES = new Set(['완료', 'Drop', '시작 전', '보류'])

function getSubProjects(projects: Project[]) {
  return projects.filter((p) => p.parent_notion_id !== null && p.parent_notion_id !== '')
}

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
  const [rate, setRate] = useState<number>(9.0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  async function loadData() {
    const [all, r] = await Promise.all([fetchAllProjects(), fetchLatestExchangeRate()])
    setProjects(all)
    setRate(r)
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

  const sub = getSubProjects(projects)

  // KPI
  const totalProjects = sub.length
  const inProgress = sub.filter((p) => p.status && !NON_ACTIVE_STATUSES.has(p.status)).length
  const totalContract = sub.reduce((acc, p) => acc + totalContractKrw(p, rate), 0)
  const totalReceivable = sub.reduce((acc, p) => acc + receivableKrw(p, rate), 0)

  // 마진 — 계약금액 또는 크리에이터 정산금이 있는 프로젝트만
  const marginProjects = sub.filter((p) => totalContractKrw(p, rate) > 0 || totalCreatorSettlementKrw(p, rate) > 0)
  const avgMarginRate = marginProjects.length > 0
    ? marginProjects.reduce((acc, p) => acc + marginRate(p, rate), 0) / marginProjects.length
    : 0
  const totalMargin = sub.reduce((acc, p) => acc + marginKrw(p, rate), 0)

  // Status pipeline — collapse active statuses into "진행중", keep "완료", exclude others
  const pipelineMap = new Map<string, number>()
  for (const p of sub) {
    const s = p.status ?? '(미설정)'
    if (EXCLUDE_STATUSES.has(s)) continue
    if (ACTIVE_STATUSES.has(s)) {
      pipelineMap.set('진행중', (pipelineMap.get('진행중') ?? 0) + 1)
    } else if (s === '완료') {
      pipelineMap.set('완료', (pipelineMap.get('완료') ?? 0) + 1)
    }
  }
  const statusData = Array.from(pipelineMap.entries()).map(([status, count]) => ({ status, count }))

  // Assignee workload
  const assigneeMap = new Map<string, number>()
  for (const p of sub) {
    for (const name of p.assignee_names) {
      assigneeMap.set(name, (assigneeMap.get(name) ?? 0) + 1)
    }
  }
  const workloadData = Array.from(assigneeMap.entries())
    .map(([assignee, count]) => ({ assignee, count }))
    .sort((a, b) => b.count - a.count)

  // Monthly
  const last6 = getLast6Months()
  const monthlyMap = new Map<string, number>(last6.map((m) => [m, 0]))
  for (const p of sub) {
    if (!p.start_date) continue
    const month = p.start_date.slice(0, 7)
    if (monthlyMap.has(month)) {
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + totalContractKrw(p, rate))
    }
  }
  const monthlyData = last6.map((month) => ({
    month: month.slice(5),
    amount: monthlyMap.get(month) ?? 0,
  }))

  // Receivable TOP 10
  const receivableList = sub
    .map((p) => ({
      id: p.id,
      name: p.name,
      brand_name: p.brand_name,
      amount: receivableKrw(p, rate),
    }))
    .filter((p) => p.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

  const fmtKrw = (n: number) => `₩${Math.round(n).toLocaleString('ko-KR')}`

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
            {syncing ? '동기화 중...' : 'Notion 동기화'}
          </button>
        </div>
      </div>

      <DashboardTabs />

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <KpiCard title="총 프로젝트" value={`${totalProjects}개`} href="/admin/projects/detail?view=total" />
        <KpiCard title="진행 중" value={`${inProgress}개`} href="/admin/projects/detail?view=active" />
        <KpiCard title="총 계약금액" value={fmtKrw(totalContract)} href="/admin/projects/detail?view=contract" />
        <KpiCard
          title="미수금"
          value={fmtKrw(totalReceivable)}
          subtitle={`환율: ¥1 = ₩${rate}`}
          href="/admin/projects/detail?view=receivable"
        />
        <KpiCard
          title="평균 마진"
          value={`${avgMarginRate.toFixed(1)}%`}
          subtitle={`총 ${fmtKrw(totalMargin)}`}
          href="/admin/projects/detail?view=margin"
        />
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
          <MonthlyLineChart data={monthlyData} />
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
