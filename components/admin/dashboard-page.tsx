'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { FileText, RefreshCw, Users, Briefcase, FolderOpen } from 'lucide-react'

export function DashboardPage() {
  const [stats, setStats] = useState({ blogCount: 0, portfolioCount: 0, creatorCount: 0, projectCount: 0 })
  const [loading, setLoading] = useState(true)
  const [blogSyncing, setBlogSyncing] = useState(false)
  const [creatorSyncing, setCreatorSyncing] = useState(false)
  const [portfolioSyncing, setPortfolioSyncing] = useState(false)
  const [projectSyncing, setProjectSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ message: string; success: boolean } | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [blogRes, portfolioRes, creatorRes, projectRes] = await Promise.all([
          supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
          supabase.from('portfolios').select('*', { count: 'exact', head: true }),
          supabase.from('creators').select('*', { count: 'exact', head: true }),
          supabase.from('projects').select('*', { count: 'exact', head: true }),
        ])
        setStats({
          blogCount: blogRes.count || 0,
          portfolioCount: portfolioRes.count || 0,
          creatorCount: creatorRes.count || 0,
          projectCount: projectRes.count || 0,
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSync = async (type: 'blog' | 'creator' | 'portfolio' | 'projects') => {
    const setSyncing =
      type === 'blog'
        ? setBlogSyncing
        : type === 'creator'
          ? setCreatorSyncing
          : type === 'portfolio'
            ? setPortfolioSyncing
            : setProjectSyncing
    setSyncing(true)
    setSyncResult(null)
    try {
      const endpoint =
        type === 'blog'
          ? 'blog'
          : type === 'creator'
            ? 'creators'
            : type === 'portfolio'
              ? 'portfolio'
              : 'projects'
      const res = await fetch(`/api/sync/${endpoint}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        const label =
          type === 'blog'
            ? '블로그'
            : type === 'creator'
              ? '크리에이터'
              : type === 'portfolio'
                ? '포트폴리오'
                : '프로젝트'
        const parts = [`${data.synced}건 동기화`]
        if (data.deleted) parts.push(`${data.deleted}건 제거`)
        if (data.errors?.length) parts.push(`${data.errors.length}건 오류`)
        if (data.exchangeRate) parts.push(`환율 ${data.exchangeRate}`)
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
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-800" />
          ))}
        </div>
        <div className="h-32 animate-pulse rounded-lg bg-neutral-800" />
      </div>
    )
  }

  const sections = [
    { label: '블로그 포스트', value: stats.blogCount, icon: FileText, color: 'text-neutral-50', syncType: 'blog' as const, syncing: blogSyncing },
    { label: '포트폴리오', value: stats.portfolioCount, icon: Briefcase, color: 'text-blue-400', syncType: 'portfolio' as const, syncing: portfolioSyncing },
    { label: '크리에이터', value: stats.creatorCount, icon: Users, color: 'text-green-400', syncType: 'creator' as const, syncing: creatorSyncing },
    { label: '프로젝트', value: stats.projectCount, icon: FolderOpen, color: 'text-orange-400', syncType: 'projects' as const, syncing: projectSyncing },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">대시보드</h1>
          <p className="mt-1 text-sm text-neutral-400">사이트 현황 요약</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-700"
        >
          대시보드 보기 →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.label} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">{section.label}</span>
                <Icon className={`h-4 w-4 ${section.color}`} />
              </div>
              <p className="mt-2 text-2xl font-semibold text-neutral-50">{section.value}</p>
              <button
                onClick={() => handleSync(section.syncType)}
                disabled={section.syncing}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${section.syncing ? 'animate-spin' : ''}`} />
                {section.syncing ? '동기화 중...' : 'Notion 동기화'}
              </button>
            </div>
          )
        })}
      </div>

      {syncResult && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm ${
          syncResult.success
            ? 'border-green-500/30 bg-green-500/10 text-green-400'
            : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          {syncResult.message}
        </div>
      )}
    </div>
  )
}
