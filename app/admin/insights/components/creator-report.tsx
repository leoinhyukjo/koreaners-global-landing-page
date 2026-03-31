'use client'

import { useMemo } from 'react'
import { aggregateByCreator, engagementRate } from '@/lib/dashboard/calculations'
import type { CampaignPostRow } from '@/lib/dashboard/calculations'

interface Props {
  posts: CampaignPostRow[]
}

export function CreatorReport({ posts }: Props) {
  const creators = useMemo(() => aggregateByCreator(posts).slice(0, 50), [posts])

  const fmtNum = (n: number) =>
    n >= 10_000 ? `${(n / 10_000).toFixed(1)}만` : n.toLocaleString('ko-KR')

  // 크리에이터별 평균 ER 계산 (posts 기반)
  const avgErByHandle = useMemo(() => {
    const map = new Map<string, number[]>()
    for (const p of posts) {
      const key = p.ig_handle ?? p.creator_name ?? 'unknown'
      const er = engagementRate(p)
      const arr = map.get(key) ?? []
      arr.push(er)
      map.set(key, arr)
    }
    const result = new Map<string, number>()
    for (const [key, ers] of map) {
      result.set(key, ers.reduce((a, b) => a + b, 0) / ers.length)
    }
    return result
  }, [posts])

  if (creators.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        크리에이터 데이터가 없습니다.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800 bg-neutral-900">
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">#</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">크리에이터</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">콘텐츠 수</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">총 조회수</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">총 Engagement</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">평균 ER</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {creators.map((c, idx) => {
            const avgEr = avgErByHandle.get(c.handle) ?? 0
            return (
              <tr
                key={c.handle}
                className="bg-neutral-900 hover:bg-neutral-800/60 transition-colors"
              >
                <td className="px-4 py-3 text-xs text-neutral-500">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-200">{c.name}</div>
                  {c.handle !== c.name && (
                    <div className="text-xs text-orange-400">@{c.handle}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-neutral-300">{c.postCount}</td>
                <td className="px-4 py-3 text-right font-medium text-neutral-200">
                  {fmtNum(c.views)}
                </td>
                <td className="px-4 py-3 text-right text-neutral-300">
                  {fmtNum(c.engagement)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      avgEr >= 5
                        ? 'text-emerald-400'
                        : avgEr >= 2
                        ? 'text-yellow-400'
                        : 'text-neutral-400'
                    }
                  >
                    {avgEr.toFixed(2)}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="px-4 py-2 text-xs text-neutral-600">{creators.length}명 (조회수 순)</p>
    </div>
  )
}
