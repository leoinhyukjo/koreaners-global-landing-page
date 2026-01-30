'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import type { BlogPost } from '@/lib/supabase'
import Link from 'next/link'
import { Calendar, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { resolveThumbnailSrc } from '@/lib/thumbnail'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { getBlogTitle } from '@/lib/localized-content'

export function LatestInsights() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const [latestPost, setLatestPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatestPost()
  }, [])

  async function fetchLatestPost() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('[Latest Insights] Error:', error)
        return
      }

      setLatestPost(data)
    } catch (err: any) {
      console.error('[Latest Insights] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !latestPost) {
    return null
  }

  const thumbnailSrc = resolveThumbnailSrc(latestPost.thumbnail_url)

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-keep">
            <span className="text-foreground">{t('latestInsightsTitle1')}</span>
            <span className="text-primary">{t('latestInsightsTitle2')}</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground break-keep">
            {t('latestInsightsDesc')}
          </p>
        </div>

        <Link href={`/blog/${latestPost.slug}`}>
          <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(217,255,0,0.15)]">
            <div className="grid md:grid-cols-2 gap-0">
              {/* 썸네일 */}
              <div className="aspect-video md:aspect-auto md:h-full relative overflow-hidden bg-muted">
                <Image
                  src={thumbnailSrc}
                  alt={`${getBlogTitle(latestPost, locale)} - ${latestPost.category}`}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* 콘텐츠 */}
              <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center">
                <div className="mb-3 sm:mb-4">
                  <Badge variant="secondary" className="text-xs break-keep">
                    {latestPost.category}
                  </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4 group-hover:text-primary transition-colors break-keep leading-tight">
                  {getBlogTitle(latestPost, locale)}
                </h3>
                {(locale === 'ko' ? latestPost.summary : latestPost.summary_jp) && (
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed line-clamp-3 break-keep">
                    {locale === 'ko' ? latestPost.summary : (latestPost.summary_jp ?? latestPost.summary)}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                  <time className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 break-keep" dateTime={latestPost.created_at}>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    {new Date(latestPost.created_at).toLocaleDateString('ko-KR')}
                  </time>
                  <span className="text-sm text-primary flex items-center gap-2 group-hover:gap-3 transition-all break-keep">
                    {t('read')}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </section>
  )
}
