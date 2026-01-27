'use client'

// 블로그 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { BlogPost } from '@/lib/supabase'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { resolveThumbnailSrc } from '@/lib/thumbnail'

const POSTS_PER_PAGE = 12

export default function BlogPage() {
  const [allBlogPosts, setAllBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const totalPages = Math.ceil(allBlogPosts.length / POSTS_PER_PAGE)
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const endIndex = startIndex + POSTS_PER_PAGE
  const blogPosts = allBlogPosts.slice(startIndex, endIndex)

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
      setAllBlogPosts(posts)
    } catch (err: any) {
      const errorMessage = err?.message || '인사이트를 불러오는 중 오류가 발생했습니다.'
      console.error('[Blog] 에러: ' + errorMessage)
      setError(errorMessage)
      setAllBlogPosts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-900">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-balance leading-tight tracking-tight">
              <span className="text-white">글로벌 마케팅 </span>
              <span className="text-white">인사이트</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-200 max-w-3xl mx-auto text-pretty leading-relaxed tracking-normal px-2">
              글로벌 마케팅 트렌드, 최신 뉴스, 실무 인사이트를 아우르는 전문 지식 채널
            </p>
          </div>

          {/* Blog Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="space-y-3">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                <p className="text-zinc-200 text-lg">인사이트를 준비 중입니다...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="space-y-4 max-w-md mx-auto">
                <div className="text-white text-4xl">⚠️</div>
                <p className="text-zinc-200 text-lg">{error}</p>
                <button
                  onClick={fetchBlogPosts}
                  className="text-white hover:underline text-sm"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : allBlogPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="space-y-3">
                <div className="text-zinc-200 text-4xl">📝</div>
                <p className="text-zinc-200 text-lg">아직 작성된 글이 없습니다.</p>
                <p className="text-zinc-300 text-sm">곧 새로운 인사이트를 공유할 예정입니다.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-20">
                {blogPosts.map((post) => (
                <article key={post.id} className="h-full">
                  <Link href={`/blog/${post.slug}`} className="block h-full">
                    <Card 
                      className="group overflow-hidden bg-zinc-800 border-zinc-700/50 hover:border-white transition-all duration-300 cursor-pointer h-full flex flex-col"
                    >
                      {/* Image */}
                      <div className="aspect-video relative overflow-hidden bg-zinc-800">
                        <Image
                          src={resolveThumbnailSrc(post.thumbnail_url)}
                          alt={`${post.title} - ${post.category} 블로그 포스트`}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                          <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-200 border-zinc-700/50 rounded-none">{post.category}</Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-6 flex-1 flex flex-col">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-white transition-colors leading-tight tracking-tight">
                          {post.title}
                        </h2>
                        {post.summary && (
                          <p className="text-xs sm:text-sm text-zinc-200 mb-4 leading-relaxed line-clamp-3 tracking-normal">
                            {post.summary}
                          </p>
                        )}

                        <div className="mt-auto pt-3 sm:pt-4 border-t border-zinc-700/50 flex items-center justify-between">
                          <time className="text-xs text-zinc-300 flex items-center gap-1" dateTime={post.created_at}>
                            <Calendar className="h-3 w-3" />
                            {new Date(post.created_at).toLocaleDateString('ko-KR')}
                          </time>
                          <span className="text-xs text-white flex items-center gap-1 group-hover:gap-2 transition-all">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12 mb-8">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentPage > 1) {
                        router.push(`/blog?page=${currentPage - 1}`)
                      }
                    }}
                    disabled={currentPage === 1}
                    className="rounded-none border-zinc-700/50 bg-zinc-800 text-white hover:bg-white hover:text-black hover:border-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    이전
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // 현재 페이지 주변 2페이지씩만 표시
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'default' : 'outline'}
                            onClick={() => router.push(`/blog?page=${page}`)}
                            className={`rounded-none min-w-[44px] ${
                              page === currentPage
                                ? 'bg-white text-black hover:bg-white'
                                : 'border-zinc-700/50 bg-zinc-800 text-white hover:bg-white hover:text-black hover:border-white'
                            }`}
                          >
                            {page}
                          </Button>
                        )
                      } else if (
                        page === currentPage - 3 ||
                        page === currentPage + 3
                      ) {
                        return (
                          <span key={page} className="px-2 text-zinc-400">
                            ...
                          </span>
                        )
                      }
                      return null
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentPage < totalPages) {
                        router.push(`/blog?page=${currentPage + 1}`)
                      }
                    }}
                    disabled={currentPage === totalPages}
                    className="rounded-none border-zinc-700/50 bg-zinc-800 text-white hover:bg-white hover:text-black hover:border-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}
