'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { CampaignFinancialRow } from '@/lib/dashboard/calculations'

interface Props {
  financials: CampaignFinancialRow[]
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

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '8px',
  color: '#e5e5e5',
  fontSize: '12px',
}

export function TrendCharts({ financials }: Props) {
  // Chart 1: 월별 매출·마진 라인 차트
  const monthlyData = useMemo(() => {
    const last6 = getLast6Months()
    const revenueMap = new Map<string, number>(last6.map((m) => [m, 0]))
    const marginMap = new Map<string, number>(last6.map((m) => [m, 0]))

    for (const f of financials) {
      if (!f.start_date) continue
      const month = f.start_date.slice(0, 7)
      if (revenueMap.has(month)) {
        revenueMap.set(month, (revenueMap.get(month) ?? 0) + f.contract_amount_krw)
        marginMap.set(month, (marginMap.get(month) ?? 0) + f.margin_krw)
      }
    }

    return last6.map((m) => ({
      month: m.slice(5), // "MM" 형식
      revenue: Math.round((revenueMap.get(m) ?? 0) / 10_000), // 만원 단위
      margin: Math.round((marginMap.get(m) ?? 0) / 10_000),
    }))
  }, [financials])

  // Chart 2: 캠페인 유형별 막대 차트
  const typeData = useMemo(() => {
    const typeMap = new Map<string, { count: number; revenue: number }>()
    for (const f of financials) {
      const type = f.campaign_type ?? f.media ?? '기타'
      const existing = typeMap.get(type) ?? { count: 0, revenue: 0 }
      existing.count += 1
      existing.revenue += f.contract_amount_krw
      typeMap.set(type, existing)
    }
    return Array.from(typeMap.entries())
      .map(([type, val]) => ({
        type,
        count: val.count,
        revenue: Math.round(val.revenue / 10_000),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
  }, [financials])

  const fmtAxis = (v: number) =>
    v >= 10_000 ? `${(v / 10_000).toFixed(0)}억` : `${v}만`

  return (
    <div className="space-y-6">
      {/* 월별 매출·마진 */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h3 className="mb-4 text-sm font-semibold text-neutral-200">
          월별 매출 · 마진 추이
          <span className="ml-2 text-xs font-normal text-neutral-500">(단위: 만원)</span>
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="month" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtAxis} tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(v: number) => [`${v.toLocaleString('ko-KR')}만원`]}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#a3a3a3' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="매출"
              stroke="#FF4500"
              strokeWidth={2}
              dot={{ fill: '#FF4500', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="margin"
              name="마진"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 캠페인 유형별 */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h3 className="mb-4 text-sm font-semibold text-neutral-200">
          캠페인 유형별 매출
          <span className="ml-2 text-xs font-normal text-neutral-500">(단위: 만원)</span>
        </h3>
        {typeData.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">데이터가 없습니다.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={typeData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="type" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtAxis} tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v: number) => [`${v.toLocaleString('ko-KR')}만원`]}
              />
              <Bar dataKey="revenue" name="매출" fill="#FF4500" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
