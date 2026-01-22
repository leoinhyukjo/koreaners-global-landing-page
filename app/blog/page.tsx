'use client'

// 블로그 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { BlogPost } from '@/lib/supabase'
import Link from 'next/link'
import { Calendar, ArrowRight } from 'lucide-react'

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBlogPosts()
  }, [])

  async function fetchBlogPosts() {
    try {
      setLoading(true)
      setError(null)
      
      // Supabase 객체 정상 생성 확인
      if (!supabase) {
        setError('환경변수 설정이 누락되었습니다.')
        setBlogPosts([])
        return
      }

      // Supabase URL이 placeholder인지 확인
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
        setError('환경변수 설정이 누락되었습니다.')
        setBlogPosts([])
        return
      }
      
      const { data, error: supabaseError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (supabaseError) {
        console.error('[Blog] 에러: ' + (supabaseError?.message || '알 수 없는 에러'))
        throw supabaseError
      }

      // 데이터 안전 처리
      const posts = Array.isArray(data) ? data : []
      setBlogPosts(posts)
    } catch (err: any) {
      const errorMessage = err?.message || '인사이트를 불러오는 중 오류가 발생했습니다.'
      console.error('[Blog] 에러: ' + errorMessage)
      setError(errorMessage)
      setBlogPosts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-balance leading-tight tracking-tight">
              <span className="text-foreground dark:text-foreground">글로벌 마케팅 </span>
              <span className="text-primary">인사이트</span>
            </h1>
            <p className="text-xl text-muted-foreground dark:text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed tracking-normal">
              글로벌 마케팅 트렌드, 최신 뉴스, 실무 인사이트를 아우르는 전문 지식 채널
            </p>
          </div>

          {/* Blog Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="space-y-3">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="text-muted-foreground text-lg">인사이트를 준비 중입니다...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="space-y-4 max-w-md mx-auto">
                <div className="text-destructive text-4xl">⚠️</div>
                <p className="text-muted-foreground text-lg">{error}</p>
                <button
                  onClick={fetchBlogPosts}
                  className="text-primary hover:underline text-sm"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="space-y-3">
                <div className="text-muted-foreground text-4xl">📝</div>
                <p className="text-muted-foreground text-lg">아직 작성된 글이 없습니다.</p>
                <p className="text-muted-foreground text-sm">곧 새로운 인사이트를 공유할 예정입니다.</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {blogPosts.map((post) => (
                <article key={post.id} className="h-full">
                  <Link href={`/blog/${post.slug}`}>
                    <Card 
                      className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer h-full flex flex-col"
                    >
                      {/* Image */}
                      {post.thumbnail_url ? (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={post.thumbnail_url}
                            alt={`${post.title} - ${post.category} 블로그 포스트`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-4 left-4">
                            <Badge variant="secondary">{post.category}</Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-6xl font-bold text-primary/20 uppercase">
                              {post.category.charAt(0)}
                            </div>
                          </div>
                          <div className="absolute top-4 left-4">
                            <Badge variant="secondary">{post.category}</Badge>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-2 group-hover:text-primary transition-colors leading-tight tracking-tight">
                          {post.title}
                        </h2>
                        {post.summary && (
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4 leading-relaxed line-clamp-3 tracking-normal">
                            {post.summary}
                          </p>
                        )}

                        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                          <time className="text-xs text-muted-foreground flex items-center gap-1" dateTime={post.created_at}>
                            <Calendar className="h-3 w-3" />
                            {new Date(post.created_at).toLocaleDateString('ko-KR')}
                          </time>
                          <span className="text-xs text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                            읽기
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
