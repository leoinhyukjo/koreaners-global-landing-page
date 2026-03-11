'use client'

import { useEffect, useState } from 'react'
import { fetchAllProjects, fetchLatestExchangeRate } from '@/lib/dashboard/queries'
import { totalContractKrw, receivableKrw, type Project } from '@/lib/dashboard/calculations'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import {
  StatusBarChart,
  TeamDonutChart,
  MonthlyLineChart,
} from '@/components/admin/dashboard/charts'

const NON_ACTIVE_STATUSES = new Set(['완료', 'Drop', '시작 전', '보류'])

/** 하위 프로젝트만 추출 (parent_notion_id 있는 것) */
function getSubProjects(projects: Project[]) {
  return projects.filter((p) => p.parent_notion_id !== null && p.parent_notion_id !== '')
}

/** 최근 6개월 목록 (YYYY-MM 형식, 오래된 순) */
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

export default function ManagementDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [rate, setRate] = useState<number>(9.0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [all, r] = await Promise.all([fetchAllProjects(), fetchLatestExchangeRate()])
      setProjects(all)
      setRate(r)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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

  // ── KPI 집계 ────────────────────────────────────────────────
  const totalProjects = sub.length

  const inProgress = sub.filter((p) => p.status && !NON_ACTIVE_STATUSES.has(p.status)).length

  const totalContract = sub.reduce((acc, p) => acc + totalContractKrw(p, rate), 0)

  const totalReceivable = sub.reduce((acc, p) => acc + receivableKrw(p, rate), 0)

  // ── 상태별 집계 ─────────────────────────────────────────────
  const statusCounts = new Map<string, number>()
  for (const p of sub) {
    const s = p.status ?? '(미설정)'
    statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1)
  }
  const statusData = Array.from(statusCounts.entries()).map(([status, count]) => ({
    status,
    count,
  }))

  // ── 팀별 집계 ───────────────────────────────────────────────
  const teamCounts = new Map<string, number>()
  for (const p of sub) {
    const teams = p.team.length > 0 ? p.team : ['(미설정)']
    for (const t of teams) {
      teamCounts.set(t, (teamCounts.get(t) ?? 0) + 1)
    }
  }
  const teamData = Array.from(teamCounts.entries()).map(([team, count]) => ({
    team,
    count,
  }))

  // ── 월별 계약금액 (최근 6개월) ──────────────────────────────
  const last6 = getLast6Months()
  const monthlyMap = new Map<string, number>(last6.map((m) => [m, 0]))
  for (const p of sub) {
    if (!p.start_date) continue
    const month = p.start_date.slice(0, 7) // YYYY-MM
    if (monthlyMap.has(month)) {
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + totalContractKrw(p, rate))
    }
  }
  const monthlyData = last6.map((month) => ({
    month: month.slice(5), // MM만 표시
    amount: monthlyMap.get(month) ?? 0,
  }))

  // ── 미수금 TOP 10 ───────────────────────────────────────────
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

  // ── 포맷 헬퍼 ───────────────────────────────────────────────
  const fmtKrw = (n: number) => `₩${Math.round(n).toLocaleString('ko-KR')}`

  return (
    <div className="space-y-6">
      {/* KPI 카드 4개 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard title="총 프로젝트" value={`${totalProjects}개`} />
        <KpiCard title="진행 중" value={`${inProgress}개`} />
        <KpiCard title="총 계약금액" value={fmtKrw(totalContract)} />
        <KpiCard
          title="미수금"
          value={fmtKrw(totalReceivable)}
          subtitle={`환율: ¥1 = ₩${rate}`}
        />
      </div>

      {/* 중단: 상태별 파이프라인 + 팀별 프로젝트 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">상태별 파이프라인</h3>
          <StatusBarChart data={statusData} />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">팀별 프로젝트</h3>
          <TeamDonutChart data={teamData} />
        </div>
      </div>

      {/* 하단: 월별 계약금액 추이 + 미수금 TOP 10 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">월별 계약금액 추이</h3>
          <MonthlyLineChart data={monthlyData} />
        </div>
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
