'use client'

import { useState, useMemo } from 'react'
import { cpv } from '@/lib/dashboard/calculations'
import type { CampaignFinancialRow, CampaignPostRow } from '@/lib/dashboard/calculations'

interface Props {
  financials: CampaignFinancialRow[]
  posts: CampaignPostRow[]
}

const STATUS_COLORS: Record<string, string> = {
  '진행 중': 'text-emerald-400',
  '완료': 'text-neutral-400',
  'Drop': 'text-red-400',
  '보류': 'text-yellow-400',
}

export function CampaignTable({ financials, posts }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // 브랜드별 총 조회수 집계
  const viewsByBrand = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of posts) {
      map.set(p.brand_name, (map.get(p.brand_name) ?? 0) + p.views)
    }
    return map
  }, [posts])

  const statuses = useMemo(
    () => Array.from(new Set(financials.map((f) => f.status).filter(Boolean))),
    [financials],
  )

  const filtered = useMemo(() => {
    return financials.filter((f) => {
      const matchSearch =
        !search ||
        f.brand_name.toLowerCase().includes(search.toLowerCase()) ||
        f.campaign_code.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || f.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [financials, search, statusFilter])

  const fmtKrw = (n: number) =>
    n >= 1_000_000
      ? `₩${(n / 1_000_000).toFixed(1)}M`
      : `₩${Math.round(n).toLocaleString('ko-KR')}`

  const fmtNum = (n: number) =>
    n >= 10_000 ? `${(n / 10_000).toFixed(1)}만` : n.toLocaleString('ko-KR')

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="브랜드 / 캠페인 코드 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 focus:border-orange-500/50 focus:outline-none"
        >
          <option value="">전체 상태</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900">
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">브랜드</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">유형</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">상태</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">계약액</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">마진</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">총 조회</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">CPV</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">담당자</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-neutral-500">
                  캠페인 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((f) => {
                const totalViews = viewsByBrand.get(f.brand_name) ?? 0
                const cpvVal = cpv(f.contract_amount_krw, totalViews)
                const marginPct =
                  f.contract_amount_krw > 0
                    ? ((f.margin_krw / f.contract_amount_krw) * 100).toFixed(1)
                    : null
                return (
                  <tr
                    key={f.campaign_code}
                    className="bg-neutral-900 hover:bg-neutral-800/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-200">
                      {f.brand_name}
                      <div className="text-xs text-neutral-500">{f.campaign_code}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {f.campaign_type ?? f.media ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_COLORS[f.status] ?? 'text-neutral-400'}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-200">
                      {fmtKrw(f.contract_amount_krw)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-400">{fmtKrw(f.margin_krw)}</span>
                      {marginPct && (
                        <div className="text-xs text-neutral-500">{marginPct}%</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-300">
                      {totalViews > 0 ? fmtNum(totalViews) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-400">
                      {cpvVal > 0 ? `₩${cpvVal.toFixed(1)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {f.pm_primary ?? '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-600">{filtered.length}개 캠페인</p>
    </div>
  )
}
