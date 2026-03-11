'use client'

import { useState } from 'react'
import { totalContractKrw, receivableKrw } from '@/lib/dashboard/calculations'
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

const statusColorMap: Record<string, string> = {
  '진행 중': 'text-blue-400',
  '완료': 'text-green-400',
  '시작 전': 'text-neutral-400',
  'Drop': 'text-red-400',
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
    <div className="space-y-2">
      {groups.map((group) => {
        const isOpen = openSet.has(group.brandName)

        return (
          <div
            key={group.brandName}
            className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden"
          >
            {/* 헤더 */}
            <button
              type="button"
              onClick={() => toggle(group.brandName)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-100">
                  {group.brandName}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({group.projects.length}건)
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* 계약금액 */}
                <span className="text-sm text-neutral-300">
                  {formatKrw(group.totalContract)}
                </span>

                {/* 미수금 (>0 일 때만) */}
                {group.totalReceivable > 0 && (
                  <span className="text-sm font-medium text-red-400">
                    미수 {formatKrw(group.totalReceivable)}
                  </span>
                )}

                {/* 펼치기/접기 아이콘 */}
                <span className="text-neutral-400 text-xs select-none">
                  {isOpen ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {/* 테이블 */}
            {isOpen && (
              <div className="overflow-x-auto border-t border-neutral-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-800/50 text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">프로젝트명</th>
                      <th className="px-4 py-2 text-left font-medium">상태</th>
                      <th className="px-4 py-2 text-left font-medium">담당자</th>
                      <th className="px-4 py-2 text-right font-medium">계약금액</th>
                      <th className="px-4 py-2 text-left font-medium">정산상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.projects.map((project) => {
                      const contractKrw = totalContractKrw(project, jpyRate)
                      const statusColor =
                        statusColorMap[project.status ?? ''] ?? 'text-neutral-300'

                      return (
                        <tr
                          key={project.id}
                          className="border-t border-neutral-800 hover:bg-neutral-800/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-neutral-100 max-w-[200px] truncate">
                            {project.name || '(이름 없음)'}
                          </td>
                          <td className={`px-4 py-3 ${statusColor}`}>
                            {project.status ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-neutral-300">
                            {project.assignee_names.length > 0
                              ? project.assignee_names.join(', ')
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-neutral-200 tabular-nums">
                            {formatKrw(contractKrw)}
                          </td>
                          <td className="px-4 py-3 text-neutral-300">
                            {project.client_settlement ?? '—'}
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
