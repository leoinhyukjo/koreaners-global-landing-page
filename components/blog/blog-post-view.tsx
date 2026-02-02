'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar } from 'lucide-react'
import { SafeImage } from '@/components/ui/SafeImage'
import { MarketingCTA } from '@/components/common/marketing-cta'
import { SafeHydration } from '@/components/common/SafeHydration'
import { resolveThumbnailSrc } from '@/lib/thumbnail'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { getBlogTitle, getBlogSummary, getBlogContent } from '@/lib/localized-content'
import type { BlogPost } from '@/lib/supabase'
import { BlogContent } from './blog-content'

interface BlogPostViewProps {
  blogPost: BlogPost
  thumbnailSrc: string
}

const BlogDetailSkeleton = () => (
  <main className="min-h-screen relative overflow-hidden bg-zinc-900" aria-hidden="true">
    <div className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-6 md:px-12 lg:px-24">
      <div className="container mx-auto max-w-7xl">
        <div className="h-10 w-48 bg-zinc-800/50 rounded animate-pulse mb-8" />
        <div className="aspect-video bg-zinc-800/50 rounded animate-pulse mb-6" />
        <div className="h-8 max-w-2xl bg-zinc-800/50 rounded animate-pulse" />
      </div>
    </div>
  </main>
)

export function BlogPostView({ blogPost, thumbnailSrc }: BlogPostViewProps) {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const displayTitle = getBlogTitle(blogPost, locale)
  const displaySummary = getBlogSummary(blogPost, locale)
  const contentToShow = getBlogContent(blogPost, locale)
  const hasContent = contentToShow && Array.isArray(contentToShow) && contentToShow.length > 0

  return (
    <SafeHydration fallback={<BlogDetailSkeleton />}>
    <main className="min-h-screen relative overflow-hidden bg-zinc-900">
      <article className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-6 md:px-12 lg:px-24 relative z-10">
        <div className="container mx-auto max-w-7xl">
          <header className="mb-8 sm:mb-12">
            <Link href="/blog">
              <Button variant="ghost" className="mb-4 sm:mb-6 min-h-[44px] break-keep text-white hover:bg-zinc-800 border-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToList')}
              </Button>
            </Link>
            <div className="space-y-4 sm:space-y-6 flex flex-col items-center">
              <div className="w-full max-w-none lg:max-w-4xl mx-auto">
                <div className="aspect-video rounded-none overflow-hidden border-0 border-y border-zinc-700/50 relative bg-zinc-800 w-full flex items-center justify-center">
                  {blogPost.thumbnail_url ? (
                    <SafeImage
                      src={thumbnailSrc}
                      alt={`${displayTitle} - ${blogPost.category}`}
                      fill
                      sizes="(max-width: 1023px) 100vw, 896px"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                      <div className="text-center px-4">
                        <div className="text-4xl mb-2">📝</div>
                        <p className="text-sm text-zinc-400">{t('performanceNoImage')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap break-keep">
                  <Badge variant="secondary" className="text-xs break-keep bg-zinc-800 text-zinc-200 border-zinc-700/50 rounded-none">{blogPost.category}</Badge>
                  <time className="text-xs sm:text-sm text-zinc-300 flex items-center gap-1 break-keep" dateTime={blogPost.created_at}>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    {new Date(blogPost.created_at).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'ko-KR')}
                  </time>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 leading-tight break-keep text-white">
                  {displayTitle}
                </h1>
              </div>
            </div>
          </header>
          {displaySummary && (
            <div className="mb-10 sm:mb-12">
              <div className="border border-zinc-700/50 bg-zinc-800 px-6 md:px-12 lg:px-24 py-6 md:py-8 lg:py-10 rounded-none">
                <p className={`text-base lg:text-lg text-zinc-200 leading-relaxed ${locale === 'ja' ? 'break-all' : 'break-keep'}`}>
                  {displaySummary}
                </p>
              </div>
              <div className="mt-10 sm:mt-12 border-t border-zinc-700/50" />
            </div>
          )}
          <div className={`${displaySummary ? 'mt-0' : 'mt-10 sm:mt-12'} border border-zinc-700/50 bg-zinc-800 px-6 md:px-12 lg:px-24 py-6 md:py-8 lg:py-10 rounded-none blog-content-wrapper`}>
            <div className="prose prose-lg dark:prose-invert max-w-none break-keep text-zinc-200 leading-relaxed text-base lg:text-lg blog-content-prose">
              {hasContent ? (
                <BlogContent blogPost={blogPost} content={contentToShow} />
              ) : (
                <p className="text-zinc-400">{t('blogNoContent')}</p>
              )}
            </div>
          </div>
          <MarketingCTA />
        </div>
      </article>
    </main>
    </SafeHydration>
  )
}
