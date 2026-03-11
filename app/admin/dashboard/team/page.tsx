'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchAllProjects, fetchLatestExchangeRate } from '@/lib/dashboard/queries'
import { type Project, receivableKrw } from '@/lib/dashboard/calculations'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import { ProjectTable } from '@/components/admin/dashboard/project-table'

// ────────────────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────────────────
const HIGH_PRIORITIES = new Set(['🔥TODAY', '높음'])

function krwShort(amount: number): string {
  if (amount === 0) return '₩0'
  if (amount >= 100_000_000) return `₩${(amount / 100_000_000).toFixed(1)}억`
  if (amount >= 10_000_000) return `₩${(amount / 10_000_000).toFixed(1)}천만`
  if (amount >= 1_000_000) return `₩${(amount / 1_000_000).toFixed(0)}백만`
  if (amount >= 10_000) return `₩${(amount / 10_000).toFixed(0)}만`
  return `₩${amount.toLocaleString('ko-KR')}`
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
export default function TeamDashboardPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [jpyRate, setJpyRate] = useState<number>(9.0)
  const [loading, setLoading] = useState(true)
  const [selectedAssignee, setSelectedAssignee] = useState<string>('전체')

  // 데이터 로드
  useEffect(() => {
    async function load() {
      const [projects, rate] = await Promise.all([
        fetchAllProjects(),
        fetchLatestExchangeRate(),
      ])
      setAllProjects(projects)
      setJpyRate(rate)
      setLoading(false)
    }
    load()
  }, [])

  // 하위 프로젝트만 (parent_notion_id 있는 것)
  const subProjects = useMemo(
    () => allProjects.filter((p) => p.parent_notion_id !== null),
    [allProjects],
  )

  // 담당자 목록 (중복 제거, 정렬)
  const assigneeOptions = useMemo(() => {
    const set = new Set<string>()
    subProjects.forEach((p) => p.assignee_names.forEach((a) => set.add(a)))
    return ['전체', ...Array.from(set).sort()]
  }, [subProjects])

  // 필터 적용
  const filtered = useMemo(() => {
    if (selectedAssignee === '전체') return subProjects
    return subProjects.filter((p) => p.assignee_names.includes(selectedAssignee))
  }, [subProjects, selectedAssignee])

  // KPI 계산
  const kpi = useMemo(() => {
    const count = filtered.length
    const highCount = filtered.filter(
      (p) => p.priority !== null && HIGH_PRIORITIES.has(p.priority),
    ).length
    const totalReceivable = filtered.reduce(
      (sum, p) => sum + receivableKrw(p, jpyRate),
      0,
    )
    return { count, highCount, totalReceivable }
  }, [filtered, jpyRate])

  // ── 로딩 스켈레톤 ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-neutral-800" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-800" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-neutral-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">팀원 대시보드</h1>
          <p className="mt-1 text-sm text-neutral-400">
            담당자별 프로젝트 현황 ({subProjects.length}개 진행 프로젝트)
          </p>
        </div>

        {/* 담당자 필터 드롭다운 */}
        <div className="flex items-center gap-2">
          <label htmlFor="assignee-filter" className="text-sm text-neutral-400">
            담당자
          </label>
          <select
            id="assignee-filter"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 outline-none transition-colors focus:border-neutral-500"
          >
            {assigneeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI 카드 3개 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="프로젝트 수"
          value={`${kpi.count}개`}
          subtitle={
            selectedAssignee === '전체'
              ? '전체 팀원'
              : `담당: ${selectedAssignee}`
          }
        />
        <KpiCard
          title="높음 / TODAY"
          value={`${kpi.highCount}개`}
          subtitle="🔥TODAY + 높음 우선순위"
        />
        <KpiCard
          title="미수금"
          value={krwShort(kpi.totalReceivable)}
          subtitle="입금 완료 제외"
        />
      </div>

      {/* 프로젝트 테이블 */}
      <ProjectTable projects={filtered} jpyRate={jpyRate} />
    </div>
  )
}
