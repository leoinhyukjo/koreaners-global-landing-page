'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { FileText, RefreshCw, Users, Briefcase, ArrowLeft } from 'lucide-react'

interface SyncResult {
  message: string
  success: boolean
}

const SYNC_SECTIONS = [
  {
    label: '블로그',
    syncType: 'blog' as const,
    desc: '발행된 포스트',
    icon: FileText,
    color: 'orange',
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    iconText: 'text-orange-400',
    btnBorder: 'border-orange-500/30 hover:border-orange-500/50',
    btnText: 'text-orange-300',
  },
  {
    label: '포트폴리오',
    syncType: 'portfolio' as const,
    desc: '포트폴리오 항목',
    icon: Briefcase,
    color: 'sky',
    iconBg: 'bg-sky-500/10 border-sky-500/20',
    iconText: 'text-sky-400',
    btnBorder: 'border-sky-500/30 hover:border-sky-500/50',
    btnText: 'text-sky-300',
  },
  {
    label: '크리에이터',
    syncType: 'creator' as const,
    desc: '등록된 크리에이터',
    icon: Users,
    color: 'emerald',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconText: 'text-emerald-400',
    btnBorder: 'border-emerald-500/30 hover:border-emerald-500/50',
    btnText: 'text-emerald-300',
  },
]

export default function ContentPage() {
  const [stats, setStats] = useState({ blogCount: 0, portfolioCount: 0, creatorCount: 0 })
  const [syncingMap, setSyncingMap] = useState<Record<string, boolean>>({})
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [blogRes, portfolioRes, creatorRes] = await Promise.all([
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
        supabase.from('portfolios').select('*', { count: 'exact', head: true }),
        supabase.from('creators').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        blogCount: blogRes.count || 0,
        portfolioCount: portfolioRes.count || 0,
        creatorCount: creatorRes.count || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const handleSync = async (type: 'blog' | 'creator' | 'portfolio') => {
    setSyncingMap((prev) => ({ ...prev, [type]: true }))
    setSyncResult(null)
    try {
      const endpoint =
        type === 'blog' ? 'blog'
        : type === 'creator' ? 'creators'
        : 'portfolio'
      const res = await fetch(`/api/sync/${endpoint}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        const label =
          type === 'blog' ? '블로그'
          : type === 'creator' ? '크리에이터'
          : '포트폴리오'
        const parts = [`${data.synced}건 동기화`]
        if (data.deleted) parts.push(`${data.deleted}건 제거`)
        if (data.errors?.length) parts.push(`${data.errors.length}건 오류`)
        setSyncResult({ message: `${label}: ${parts.join(', ')}`, success: !data.errors?.length })

        const refreshRes = type === 'blog'
          ? await supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true)
          : type === 'portfolio'
          ? await supabase.from('portfolios').select('*', { count: 'exact', head: true })
          : await supabase.from('creators').select('*', { count: 'exact', head: true })
        const key = type === 'blog' ? 'blogCount' : type === 'portfolio' ? 'portfolioCount' : 'creatorCount'
        setStats((prev) => ({ ...prev, [key]: refreshRes.count || 0 }))
      } else {
        setSyncResult({ message: data.error || '동기화 실패', success: false })
      }
    } catch {
      setSyncResult({ message: '네트워크 오류', success: false })
    } finally {
      setSyncingMap((prev) => ({ ...prev, [type]: false }))
    }
  }

  const getCount = (type: string) =>
    type === 'blog' ? stats.blogCount
    : type === 'portfolio' ? stats.portfolioCount
    : stats.creatorCount

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          어드민
        </Link>
      </div>

      <div>
        <h1 className="text-lg font-semibold text-neutral-50">콘텐츠 관리</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Notion에서 데이터를 동기화합니다</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-neutral-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SYNC_SECTIONS.map((section) => {
            const Icon = section.icon
            const syncing = syncingMap[section.syncType] ?? false
            return (
              <div
                key={section.syncType}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${section.iconBg}`}>
                    <Icon className={`h-4 w-4 ${section.iconText}`} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">{section.label}</p>
                  <p className="text-2xl font-semibold text-neutral-50 mt-0.5 tabular-nums">{getCount(section.syncType)}</p>
                  <p className="text-xs text-neutral-600 mt-0.5">{section.desc}</p>
                </div>
                <button
                  onClick={() => handleSync(section.syncType)}
                  disabled={syncing}
                  className={`mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg border bg-neutral-800/50 px-3 py-2 text-xs transition-colors hover:bg-neutral-700/50 disabled:opacity-50 ${section.btnBorder} ${section.btnText}`}
                >
                  <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? '동기화 중...' : '동기화'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {syncResult && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
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
