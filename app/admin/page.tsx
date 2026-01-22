'use client'

// 관리자 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio, BlogPost, Creator } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, FileText, Users, TrendingUp, ArrowRight, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    portfolios: 0,
    blogPosts: 0,
    creators: 0,
  })
  const [recentPortfolios, setRecentPortfolios] = useState<Portfolio[]>([])
  const [recentBlogPosts, setRecentBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      // 통계 데이터 가져오기
      const [portfoliosResult, blogPostsResult, creatorsResult] = await Promise.all([
        supabase.from('portfolios').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
        supabase.from('creators').select('id', { count: 'exact', head: true }),
      ])

      setStats({
        portfolios: portfoliosResult.count || 0,
        blogPosts: blogPostsResult.count || 0,
        creators: creatorsResult.count || 0,
      })

      // 최근 포트폴리오 가져오기
      const { data: portfolios } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

      // 최근 블로그 포스트 가져오기
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
    {
      title: '포트폴리오',
      value: stats.portfolios,
      icon: FolderOpen,
      href: '/admin/portfolios',
      color: 'text-blue-500',
    },
    {
      title: '블로그 포스트',
      value: stats.blogPosts,
      icon: FileText,
      href: '/admin/blog',
      color: 'text-green-500',
    },
    {
      title: '크리에이터',
      value: stats.creators,
      icon: Users,
      href: '/admin/creators',
      color: 'text-purple-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">관리자 패널에 오신 것을 환영합니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-6 md:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color} group-hover:scale-110 transition-transform`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{loading ? '...' : stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    총 {stat.title} 수
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* 최근 활동 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 최근 포트폴리오 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>최근 포트폴리오</CardTitle>
                <CardDescription>가장 최근에 등록된 포트폴리오</CardDescription>
              </div>
              <Link href="/admin/portfolios">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
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
                    href={`/admin/portfolios`}
                    className="block p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{portfolio.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{portfolio.client_name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {portfolio.category && portfolio.category.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {portfolio.category[0]}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
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

        {/* 최근 블로그 포스트 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>최근 블로그 포스트</CardTitle>
                <CardDescription>가장 최근에 작성된 블로그 글</CardDescription>
              </div>
              <Link href="/admin/blog">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
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
                    href={`/admin/blog`}
                    className="block p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{post.title}</h4>
                        {post.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.summary}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {post.category}
                          </Badge>
                          {post.published ? (
                            <Badge variant="default" className="text-xs">발행됨</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">임시저장</Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
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
