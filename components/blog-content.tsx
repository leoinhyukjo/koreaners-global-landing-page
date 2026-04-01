'use client'

import Navigation from '@/components/navigation'
import { SafeHydration } from '@/components/common/SafeHydration'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { BlogPost } from '@/lib/supabase'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { SectionTag } from '@/components/ui/section-tag'
import { SafeImage } from '@/components/ui/SafeImage'
import { resolveThumbnailSrc } from '@/lib/thumbnail'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { getBlogTitle } from '@/lib/localized-content'
import { GlassCard } from '@/components/ui/glass-card'
import { AuroraBackground } from '@/components/ui/aurora-background'

const POSTS_PER_PAGE = 9

function BlogContent() {
  const { locale } = useLocale()
  const [allBlogPosts, setAllBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

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
        setError(t('blogEnvError'))
        setAllBlogPosts([])
        return
      }

      // Supabase URL이 placeholder인지 확인
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
        setError(t('blogEnvError'))
        setAllBlogPosts([])
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
      const errorMessage = err?.message || t('blogLoadError')
      console.error('[Blog] 에러: ' + errorMessage)
      setError(errorMessage)
      setAllBlogPosts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-12 sm:pb-16 py-24 md:py-32 lg:py-40 px-6 lg:px-24 w-full max-w-full overflow-hidden relative hero-glow">
        <AuroraBackground
          blobs={[
            { color: 'rgba(255,69,0,0.06)', size: 450, top: '0%', left: '60%', animation: 'aurora-float', duration: '18s' },
          ]}
          withDotPattern={false}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-12 sm:mb-16">
            <SectionTag variant="dark">BLOG</SectionTag>
            <div className="mb-8" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              <span>{t('blogHeroTitle')}</span>
              <span>{t('blogHeroTitle2')}</span>
            </h1>
            <p className="text-lg text-[#A8A29E] max-w-2xl mt-6">
              {t('blogHeroDesc')}
            </p>
          </div>

          {/* Blog Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="space-y-3">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                <p className="text-white/80 text-lg">{t('blogLoading')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="space-y-4 max-w-md mx-auto">
                <div className="text-white text-4xl">⚠️</div>
                <p className="text-white/80 text-lg">{error}</p>
                <button
                  onClick={fetchBlogPosts}
                  className="text-white hover:underline text-sm"
                >
                  {t('blogRetry')}
                </button>
              </div>
            </div>
          ) : allBlogPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="space-y-3">
                <div className="text-white/80 text-4xl">📝</div>
                <p className="text-white/80 text-lg">{t('blogEmpty')}</p>
                <p className="text-white/60 text-sm">{t('blogEmptySub')}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-20">
                {blogPosts.map((post) => (
                <article key={post.id} className="h-full">
                  <Link href={`/blog/${post.slug}`} className="block h-full">
                    <GlassCard variant="dark" className="group overflow-hidden cursor-pointer h-full flex flex-col p-0" hover={false}>
                      {/* Image */}
                      <div className="aspect-video relative overflow-hidden bg-card">
                        {post.thumbnail_url ? (
                          <SafeImage
                            src={resolveThumbnailSrc(post.thumbnail_url)}
                            alt={`${getBlogTitle(post, locale)} - ${post.category}`}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-card">
                            <div className="text-center px-4">
                              <div className="text-4xl mb-2">📝</div>
                              <p className="text-sm text-[#A8A29E]">{t('performanceNoImage')}</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                          <Badge variant="secondary" className="text-xs bg-card text-white/80 border-border">{post.category}</Badge>
                        </div>
                      </div>

                      {/* Content: KR/JP 동일 여백 유지, 줄바꿈으로 넘침 방지 */}
                      <div className="p-4 sm:p-6 flex-1 flex flex-col min-w-0 overflow-hidden">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 group-hover:text-white transition-colors leading-tight tracking-tight break-words pr-1">
                          {getBlogTitle(post, locale)}
                        </h2>
                        <div className="mt-auto pt-3 sm:pt-4 border-t border-border flex items-center justify-between">
                          <time className="text-xs text-[#A8A29E] flex items-center gap-1" dateTime={post.created_at}>
                            <Calendar className="h-3 w-3" />
                            {new Date(post.created_at).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'ko-KR')}
                          </time>
                          <span className="text-xs text-[#FF4500] flex items-center gap-1 group-hover:gap-2 transition-all">
                            {t('read')}
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </GlassCard>
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
                    className="border-border bg-card text-white hover:bg-white/10 hover:text-white hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('prev')}
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
                            className={`min-w-[44px] ${
                              page === currentPage
                                ? 'gradient-warm text-white hover:opacity-90'
                                : 'border-border bg-card text-white hover:bg-white/10 hover:text-white hover:border-border'
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
                          <span key={page} className="px-2 text-[#A8A29E]">
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
                    className="border-border bg-card text-white hover:bg-white/10 hover:text-white hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}

const BlogSkeleton = () => (
  <section className="pt-32 sm:pt-40 pb-12 sm:pb-16 px-6 lg:px-24 min-h-screen" aria-hidden="true">
    <div className="max-w-7xl mx-auto">
      <div className="mb-12 sm:mb-16">
        <div className="h-7 w-20 bg-card/50 rounded-full animate-pulse mb-3" />
        <div className="mb-8" />
        <div className="h-12 sm:h-14 max-w-2xl bg-card/50 rounded animate-pulse" />
        <div className="h-5 max-w-xl bg-card/50 rounded animate-pulse mt-6" />
      </div>
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent" />
      </div>
    </div>
  </section>
)

export default function BlogPageContent() {
  return (
    <main className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      <Navigation />
      <SafeHydration fallback={<BlogSkeleton />}>
        <Suspense fallback={<BlogSkeleton />}>
          <BlogContent />
        </Suspense>
      </SafeHydration>
    </main>
  )
}
