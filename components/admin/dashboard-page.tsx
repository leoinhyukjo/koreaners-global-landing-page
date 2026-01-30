'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio, BlogPost, Creator } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, FileText, Users, ArrowRight, Calendar, MessageSquare, Mail, Inbox } from 'lucide-react'
import Link from 'next/link'

export function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [stats, setStats] = useState({
    portfolios: 0,
    blogPosts: 0,
    creators: 0,
  })
  const [inquiryStats, setInquiryStats] = useState({
    unread: 0,
    today: 0,
    total: 0,
  })
  const [recentPortfolios, setRecentPortfolios] = useState<Portfolio[]>([])
  const [recentBlogPosts, setRecentBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) fetchDashboardData()
  }, [isMounted])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

      const [portfoliosResult, blogPostsResult, creatorsResult, inquiryTotalResult, inquiryUnreadResult, inquiryTodayResult] =
        await Promise.all([
          supabase.from('portfolios').select('*', { count: 'exact', head: true }),
          supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
          supabase.from('creators').select('*', { count: 'exact', head: true }),
          supabase.from('inquiries').select('*', { count: 'exact', head: true }),
          supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('is_read', false),
          supabase
            .from('inquiries')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfToday.toISOString())
            .lt('created_at', endOfToday.toISOString()),
        ])

      setStats({
        portfolios: portfoliosResult.count ?? 0,
        blogPosts: blogPostsResult.count ?? 0,
        creators: creatorsResult.count ?? 0,
      })
      setInquiryStats({
        total: inquiryTotalResult.count ?? 0,
        unread: inquiryUnreadResult.error ? 0 : (inquiryUnreadResult.count ?? 0),
        today: inquiryTodayResult.count ?? 0,
      })

      const { data: portfolios } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

      const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2)

      setRecentPortfolios(portfolios || [])
      setRecentBlogPosts(blogPosts || [])
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: '포트폴리오', value: stats.portfolios, icon: FolderOpen, href: '/admin/portfolios', color: 'text-blue-500' },
    { title: '블로그 포스트', value: stats.blogPosts, icon: FileText, href: '/admin/blog', color: 'text-green-500' },
    { title: '크리에이터', value: stats.creators, icon: Users, href: '/admin/creators', color: 'text-purple-500' },
  ]

  if (!isMounted) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <div className="h-9 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-lg border shadow-sm overflow-hidden">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-9 w-16 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <Card className="rounded-lg border shadow-sm">
            <CardHeader>
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
          <Card className="rounded-lg border shadow-sm">
            <CardHeader>
              <div className="h-5 w-36 animate-pulse rounded bg-muted" />
              <div className="h-4 w-52 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const inquiryStatCards = [
    { title: '미열람 문의', value: inquiryStats.unread, icon: Mail, href: '/admin/inquiries', color: 'text-amber-500' },
    { title: '오늘 들어온 문의', value: inquiryStats.today, icon: Inbox, href: '/admin/inquiries', color: 'text-cyan-500' },
    { title: '전체 문의', value: inquiryStats.total, icon: MessageSquare, href: '/admin/inquiries', color: 'text-indigo-500' },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">관리자 패널에 오신 것을 환영합니다</p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">문의 요약</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {inquiryStatCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.title} href={stat.href}>
                <Card className="rounded-lg border shadow-sm cursor-pointer transition-all hover:border-primary/50 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className={`h-5 w-5 shrink-0 ${stat.color} transition-transform group-hover:scale-110`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold sm:text-3xl">
                      {loading ? (
                        <span className="inline-block h-8 w-10 animate-pulse rounded bg-muted" aria-hidden />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">문의 내역에서 확인</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">콘텐츠 현황</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="rounded-lg border shadow-sm cursor-pointer transition-all hover:border-primary/50 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-5 w-5 shrink-0 ${stat.color} transition-transform group-hover:scale-110`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold sm:text-3xl">{loading ? '...' : stat.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">총 {stat.title} 수</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="rounded-lg border shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>최근 포트폴리오</CardTitle>
                <CardDescription>가장 최근에 등록된 포트폴리오</CardDescription>
              </div>
              <Link href="/admin/portfolios" className="w-fit">
                <Badge variant="outline" className="cursor-pointer px-4 py-2.5 touch-manipulation hover:bg-accent">
                  모두 보기
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            ) : recentPortfolios.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 포트폴리오가 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {recentPortfolios.map((portfolio) => (
                  <Link
                    key={portfolio.id}
                    href={`/admin/portfolios/${portfolio.id}`}
                    className="block rounded-lg border border-border p-3 transition-all hover:border-primary/50 hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium">{portfolio.title}</h4>
                        <p className="mt-1 text-xs text-muted-foreground">{portfolio.client_name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {portfolio.category && portfolio.category.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {portfolio.category[0]}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(portfolio.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>최근 블로그 포스트</CardTitle>
                <CardDescription>가장 최근에 작성된 블로그 글</CardDescription>
              </div>
              <Link href="/admin/blog" className="w-fit">
                <Badge variant="outline" className="cursor-pointer px-4 py-2.5 touch-manipulation hover:bg-accent">
                  모두 보기
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            ) : recentBlogPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 블로그 포스트가 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {recentBlogPosts.map((post) => (
                  <Link
                    key={post.id}
                    href="/admin/blog"
                    className="block rounded-lg border border-border p-3 transition-all hover:border-primary/50 hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium">{post.title}</h4>
                        {post.summary && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.summary}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {post.category}
                          </Badge>
                          {post.published ? (
                            <Badge variant="default" className="text-xs">발행됨</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">임시저장</Badge>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
