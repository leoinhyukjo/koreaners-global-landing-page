'use client'

import { useState } from 'react'
import { totalContractKrw } from '@/lib/dashboard/calculations'
import type { Project } from '@/lib/dashboard/calculations'

export interface BrandGroup {
  brandName: string
  projects: Project[]
  totalContract: number
  totalReceivable: number
}

interface BrandAccordionProps {
  groups: BrandGroup[]
  jpyRate: number
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? '—'
  const isActive = s !== '완료' && s !== 'Drop' && s !== '시작 전' && s !== '보류' && s !== '—'
  const isDone = s === '완료'
  const isDrop = s === 'Drop'

  const style = isDone
    ? 'bg-green-500/10 text-green-400'
    : isDrop
      ? 'bg-red-500/10 text-red-400'
      : isActive
        ? 'bg-neutral-700/60 text-neutral-300'
        : 'bg-neutral-800/50 text-neutral-500'

  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${style}`}>
      {s}
    </span>
  )
}

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

export function BrandAccordion({ groups, jpyRate }: BrandAccordionProps) {
  const [openSet, setOpenSet] = useState<Set<string>>(new Set())

  function toggle(brandName: string) {
    setOpenSet((prev) => {
      const next = new Set(prev)
      if (next.has(brandName)) {
        next.delete(brandName)
      } else {
        next.add(brandName)
      }
      return next
    })
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        표시할 브랜드 데이터가 없습니다.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {groups.map((group, groupIdx) => {
        const isOpen = openSet.has(group.brandName)

        return (
          <div
            key={group.brandName}
            className="rounded-lg border border-neutral-800 overflow-hidden"
          >
            {/* 헤더 */}
            <button
              type="button"
              onClick={() => toggle(group.brandName)}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${
                isOpen
                  ? 'bg-neutral-800'
                  : 'bg-neutral-900 hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 tabular-nums w-5">
                  {groupIdx + 1}
                </span>
                <span className={`font-medium ${isOpen ? 'text-white' : 'text-neutral-100'}`}>
                  {group.brandName}
                </span>
                <span className="text-xs text-neutral-500">
                  {group.projects.length}건
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-300 tabular-nums">
                  {formatKrw(group.totalContract)}
                </span>

                {group.totalReceivable > 0 ? (
                  <span className="text-sm font-medium text-red-400 tabular-nums">
                    미수 {formatKrw(group.totalReceivable)}
                  </span>
                ) : group.totalContract > 0 ? (
                  <span className="text-sm text-green-400 tabular-nums">
                    수금 완료
                  </span>
                ) : null}

                <span
                  className="text-neutral-500 text-xs select-none transition-transform duration-200 inline-block"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  ▼
                </span>
              </div>
            </button>

            {/* 테이블 */}
            {isOpen && (
              <div className="overflow-x-auto border-t border-neutral-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-800/70 text-neutral-500">
                      <th className="px-4 py-2 text-left font-normal text-xs">프로젝트명</th>
                      <th className="px-4 py-2 text-left font-normal text-xs">상태</th>
                      <th className="px-4 py-2 text-left font-normal text-xs">담당자</th>
                      <th className="px-4 py-2 text-left font-normal text-xs">시작일</th>
                      <th className="px-4 py-2 text-right font-normal text-xs">계약금액</th>
                      <th className="px-4 py-2 text-left font-normal text-xs">정산</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.projects.map((project, rowIdx) => {
                      const contractKrw = totalContractKrw(project, jpyRate)

                      return (
                        <tr
                          key={project.id}
                          className="border-t border-neutral-800/50 hover:bg-neutral-800/40 transition-colors"
                          style={rowIdx % 2 === 1 ? { backgroundColor: 'rgba(255,255,255,0.02)' } : undefined}
                        >
                          <td className="px-4 py-2.5 text-neutral-200 max-w-[200px] truncate">
                            {project.name || '(이름 없음)'}
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusBadge status={project.status} />
                          </td>
                          <td className="px-4 py-2.5 text-neutral-500 text-xs">
                            {project.assignee_names.length > 0
                              ? project.assignee_names.join(', ')
                              : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-neutral-500 text-xs tabular-nums whitespace-nowrap">
                            {project.start_date ? project.start_date.slice(2).replace(/-/g, '.') : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-neutral-300 tabular-nums">
                            {formatKrw(contractKrw)}
                          </td>
                          <td className="px-4 py-2.5 text-neutral-500 text-xs">
                            {project.payment_status ?? '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
