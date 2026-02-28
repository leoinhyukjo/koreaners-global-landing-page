'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FileText, Globe, FilePen } from 'lucide-react'
import Link from 'next/link'

interface BlogStats {
  total: number
  published: number
  draft: number
}

interface RecentPost {
  id: string
  title: string
  slug: string
  category: string
  published: boolean
  created_at: string
}

export function DashboardPage() {
  const [stats, setStats] = useState<BlogStats>({ total: 0, published: 0, draft: 0 })
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [allRes, publishedRes, recentRes] = await Promise.all([
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('published', true),
          supabase.from('blog_posts').select('id, title, slug, category, published, created_at').order('created_at', { ascending: false }).limit(5),
        ])

        setStats({
          total: allRes.count || 0,
          published: publishedRes.count || 0,
          draft: (allRes.count || 0) - (publishedRes.count || 0),
        })
        setRecentPosts(recentRes.data || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-md bg-neutral-800" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-800" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-neutral-800" />
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
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-neutral-50">대시보드</h1>
        <p className="mt-1 text-sm text-neutral-400">블로그 현황 요약</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">{card.label}</span>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="mt-2 text-2xl font-semibold text-neutral-50">{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Posts */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-50">최근 포스트</h2>
          <Link
            href="/admin/blog"
            className="text-xs text-neutral-400 transition-colors hover:text-neutral-50"
          >
            모두 보기 →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 divide-y divide-neutral-800">
          {recentPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <FileText className="mb-2 h-8 w-8" />
              <p className="text-sm">아직 포스트가 없습니다</p>
            </div>
          ) : (
            recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-50">{post.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {post.category} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span
                  className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    post.published
                      ? 'bg-green-400/10 text-green-400'
                      : 'bg-yellow-400/10 text-yellow-400'
                  }`}
                >
                  {post.published ? '발행' : '임시저장'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
