'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FileText, Globe, FilePen, RefreshCw, Users } from 'lucide-react'

export function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 })
  const [loading, setLoading] = useState(true)
  const [blogSyncing, setBlogSyncing] = useState(false)
  const [creatorSyncing, setCreatorSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ message: string; success: boolean } | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [allRes, publishedRes] = await Promise.all([
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('published', true),
        ])
        setStats({
          total: allRes.count || 0,
          published: publishedRes.count || 0,
          draft: (allRes.count || 0) - (publishedRes.count || 0),
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSync = async (type: 'blog' | 'creator') => {
    const setSyncing = type === 'blog' ? setBlogSyncing : setCreatorSyncing
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch(`/api/sync/${type === 'blog' ? 'blog' : 'creators'}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        const label = type === 'blog' ? '블로그' : '크리에이터'
        const parts = [`${data.synced}건 동기화`]
        if (data.deleted) parts.push(`${data.deleted}건 제거`)
        if (data.errors?.length) parts.push(`${data.errors.length}건 오류`)
        setSyncResult({ message: `${label}: ${parts.join(', ')}`, success: !data.errors?.length })
      } else {
        setSyncResult({ message: data.error || '동기화 실패', success: false })
      }
    } catch {
      setSyncResult({ message: '네트워크 오류', success: false })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-md bg-neutral-800" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-800" />
          ))}
        </div>
        <div className="h-32 animate-pulse rounded-lg bg-neutral-800" />
      </div>
    )
  }

  const statCards = [
    { label: '전체 포스트', value: stats.total, icon: FileText, color: 'text-neutral-50' },
    { label: '발행됨', value: stats.published, icon: Globe, color: 'text-green-400' },
    { label: '임시저장', value: stats.draft, icon: FilePen, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-neutral-50">대시보드</h1>
        <p className="mt-1 text-sm text-neutral-400">사이트 현황 요약</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">{card.label}</span>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="mt-2 text-2xl font-semibold text-neutral-50">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-neutral-50">Notion 동기화</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSync('blog')}
            disabled={blogSyncing}
            className="flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-50 transition-colors hover:border-neutral-700 hover:bg-neutral-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${blogSyncing ? 'animate-spin' : ''}`} />
            {blogSyncing ? '동기화 중...' : '블로그 동기화'}
          </button>
          <button
            onClick={() => handleSync('creator')}
            disabled={creatorSyncing}
            className="flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-50 transition-colors hover:border-neutral-700 hover:bg-neutral-800 disabled:opacity-50"
          >
            <Users className={`h-4 w-4 ${creatorSyncing ? 'animate-spin' : ''}`} />
            {creatorSyncing ? '동기화 중...' : '크리에이터 동기화'}
          </button>
        </div>
        {syncResult && (
          <div className={`mt-3 rounded-lg border px-4 py-2.5 text-sm ${
            syncResult.success
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}>
            {syncResult.message}
          </div>
        )}
      </div>
    </div>
  )
}
