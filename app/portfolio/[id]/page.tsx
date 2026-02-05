'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import Navigation from '@/components/navigation'
import { SafeHydration } from '@/components/common/SafeHydration'
import { MarketingCTA } from '@/components/common/marketing-cta'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/contexts/locale-context'
import { getPortfolioTitle, getPortfolioClientName } from '@/lib/localized-content'
import { getTranslation } from '@/lib/translations'

function PortfolioContentLoadingPlaceholder() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-zinc-200">{t('contentLoading')}</p>
    </div>
  )
}

const PortfolioContentClient = dynamic(
  () => import('@/components/portfolio/portfolio-content-client').then((mod) => ({ default: mod.PortfolioContentClient })),
  {
    ssr: false,
    loading: () => <PortfolioContentLoadingPlaceholder />,
  }
)

const PortfolioDetailSkeleton = () => (
  <div className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-6 md:px-12 lg:px-24 min-h-screen" aria-hidden="true">
    <div className="container mx-auto max-w-7xl">
      <div className="h-10 w-48 bg-zinc-800/50 rounded animate-pulse mb-8" />
      <div className="aspect-video bg-zinc-800/50 rounded animate-pulse mb-6" />
      <div className="h-8 max-w-2xl bg-zinc-800/50 rounded animate-pulse" />
    </div>
  </div>
)

export default function PortfolioDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [otherPortfolios, setOtherPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolio()
  }, [id])

  useEffect(() => {
    if (!id) return
    fetchOtherPortfolios()
  }, [id])

  // Force scroll to top on mount & when id changes (detail page fix for mobile bottom-start bug)
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [id])

  // Also scroll when loading finishes (handles layout shift after client fetch)
  useEffect(() => {
    if (!loading) {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }, [loading])

  async function fetchPortfolio() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setPortfolio(data)
    } catch (error: any) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchOtherPortfolios() {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setOtherPortfolios(data || [])
    } catch (error: any) {
      console.error('Error fetching other portfolios:', error)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-zinc-900">
        <Navigation />
        <SafeHydration fallback={<PortfolioDetailSkeleton />}>
          <div className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-24">
            <div className="container mx-auto max-w-7xl text-center">
              <p className="text-zinc-200">{t('loading')}</p>
            </div>
          </div>
        </SafeHydration>
      </main>
    )
  }

  if (!portfolio) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-zinc-900">
        <Navigation />
        <SafeHydration fallback={<PortfolioDetailSkeleton />}>
          <div className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-6 md:px-12 lg:px-24">
            <div className="container mx-auto max-w-7xl text-center">
              <p className="text-zinc-200 mb-6">{t('portfolioNotFound')}</p>
              <Link href="/portfolio">
                <Button variant="ghost" className="min-h-[44px] text-white hover:bg-zinc-800 border-0">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('backToList')}
                </Button>
              </Link>
            </div>
          </div>
        </SafeHydration>
      </main>
    )
  }

  const displayTitle = getPortfolioTitle(portfolio, locale)
  const displayClientName = getPortfolioClientName(portfolio, locale)
  const contentToShow = locale === 'ja' && portfolio.content_jp && Array.isArray(portfolio.content_jp) && portfolio.content_jp.length > 0
    ? portfolio.content_jp
    : (portfolio.content && Array.isArray(portfolio.content) ? portfolio.content : [])
  const hasContent = contentToShow.length > 0

  return (
    <main className="min-h-screen relative overflow-hidden bg-zinc-900">
      <Navigation />
      <SafeHydration fallback={<PortfolioDetailSkeleton />}>
      <article className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-6 md:px-12 lg:px-24 relative z-10">
        <div className="container mx-auto max-w-7xl">
          <header className="mb-8 sm:mb-12">
            <Link href="/portfolio">
              <Button variant="ghost" className="mb-4 sm:mb-6 min-h-[44px] break-keep text-white hover:bg-zinc-800 border-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToList')}
              </Button>
            </Link>

            <div className="space-y-4 sm:space-y-6 flex flex-col items-center">
              <div className="w-full max-w-none lg:max-w-4xl mx-auto">
                <div className="aspect-video rounded-none overflow-hidden border-0 border-y border-zinc-700/50 relative bg-zinc-800 w-full">
                  {portfolio.thumbnail_url ? (
                    <img
                      src={portfolio.thumbnail_url}
                      alt={displayTitle}
                      className="w-full h-full object-cover mx-auto block"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                      <div className="text-center px-4">
                        <div className="text-4xl mb-2">📁</div>
                        <p className="text-sm text-zinc-400">{t('performanceNoImage')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 타이틀 섹션: 제목 + 제작 날짜만 */}
              <div className="w-full">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight break-keep text-white">
                  {displayTitle}
                </h1>
                <time className="text-xs sm:text-sm text-zinc-400 flex items-center gap-1.5 break-keep" dateTime={portfolio.created_at}>
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(portfolio.created_at).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'ko-KR')}
                </time>
              </div>
            </div>
          </header>

          {/* 제목과 본문 구분선 */}
          <div className="border-t border-zinc-700/50 mt-8 sm:mt-10 mb-8 sm:mb-10" />

          {/* 본문 - 블로그와 동일한 박스 + prose */}
          <div className="border border-zinc-700/50 bg-zinc-800 px-6 md:px-12 lg:px-24 py-6 md:py-8 lg:py-10 rounded-none blog-content-wrapper">
            {hasContent ? (
              <div className="prose prose-lg dark:prose-invert max-w-none break-keep text-zinc-200 leading-relaxed text-base lg:text-lg blog-content-prose">
                <PortfolioContentClient portfolio={portfolio} content={contentToShow} />
              </div>
            ) : (
              <p className="text-zinc-400">{t('portfolioNoContent')}</p>
            )}
          </div>

          <MarketingCTA />

          {otherPortfolios.length > 0 && (
            <section className="mt-12 sm:mt-16 pt-10 sm:pt-12 border-t border-zinc-700/50">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">{t('portfolioOther')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {otherPortfolios.map((item) => (
                  <Link key={item.id} href={`/portfolio/${item.id}`} className="block h-full">
                    <Card className="group overflow-hidden bg-zinc-800 border-zinc-700/50 hover:border-white transition-all duration-300 cursor-pointer h-full flex flex-col">
                      <div className="aspect-video relative overflow-hidden bg-zinc-800">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={getPortfolioTitle(item, locale)}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-zinc-600">
                              {item.category?.[0]?.charAt(0) ?? 'P'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-white group-hover:text-white transition-colors line-clamp-2">
                          {getPortfolioTitle(item, locale)}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">{getPortfolioClientName(item, locale)}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link href="/portfolio" className="inline-block">
                  <Button
                    className="px-12 py-6 text-lg font-black rounded-none transition-colors duration-300"
                  >
                    {t('portfolioViewAll')}
                  </Button>
                </Link>
              </div>
            </section>
          )}
        </div>
      </article>
      </SafeHydration>
    </main>
  )
}
