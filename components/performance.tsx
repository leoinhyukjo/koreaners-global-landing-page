'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SkeletonGrid } from '@/components/ui/skeleton-card'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { getPortfolioTitle, getPortfolioClientName } from '@/lib/localized-content'

export function Performance() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)

  // Embla Carousel 설정
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    slidesToScroll: 1,
  })

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  useEffect(() => {
    fetchPortfolios()
  }, [])

  async function fetchPortfolios() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPortfolios(data || [])
    } catch (error: any) {
      console.error('Error fetching portfolios:', error)
      setPortfolios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setPrevBtnDisabled(!emblaApi.canScrollPrev())
      setNextBtnDisabled(!emblaApi.canScrollNext())
    }

    emblaApi.on('select', onSelect)
    onSelect()
  }, [emblaApi])

  return (
    <section id="performance" className="py-12 sm:py-16 relative bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 border-t border-zinc-700/50 w-full max-w-full overflow-hidden">
      <div className="container mx-auto max-w-7xl w-full max-w-full px-4 sm:px-6 lg:px-24 overflow-hidden">
          <div className="text-center mb-12 block">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 text-balance break-keep break-words leading-[1.2] tracking-tight block">
              <span className="text-white">{t('performanceTitle1')}{t('performanceTitle2')}</span>
            </h2>
            <p className="text-lg text-zinc-200 mb-8 break-keep max-w-prose mx-auto leading-[1.5] tracking-tight block min-h-[1.5em]">
              {t('performanceSubtitle')}
            </p>
          </div>

          {/* Portfolio Carousel */}
          {loading ? (
            <SkeletonGrid count={3} />
          ) : portfolios.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-200 text-lg">
                {t('performanceEmpty')}
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Navigation Buttons - Desktop Only */}
              <div className="hidden lg:block">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollPrev}
                  disabled={prevBtnDisabled}
                  className="absolute left-4 sm:left-6 lg:left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-zinc-800/95 backdrop-blur-sm border-zinc-700/50 hover:bg-white hover:text-black hover:border-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                  aria-label={t('performancePrevSlide')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollNext}
                  disabled={nextBtnDisabled}
                  className="absolute right-4 sm:right-6 lg:right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-zinc-800/95 backdrop-blur-sm border-zinc-700/50 hover:bg-white hover:text-black hover:border-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                  aria-label={t('performanceNextSlide')}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Carousel Container */}
              <div className="overflow-hidden px-0 lg:pl-36 lg:pr-36" ref={emblaRef}>
                <div className="flex gap-4">
                  {portfolios.map(item => (
                    <div key={item.id} className="flex-[0_0_100%] md:flex-[0_0_calc(50%-8px)] lg:flex-[0_0_calc(33.333%-11px)] min-w-0">
                      <Link href={`/portfolio/${item.id}`}>
                        <Card 
                          className="group overflow-hidden bg-zinc-800 border-zinc-700/50 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 cursor-pointer h-full rounded-none"
                        >
                          {/* Image */}
                          {item.thumbnail_url ? (
                            <div className="aspect-video relative overflow-hidden bg-zinc-950">
                              <img
                                src={item.thumbnail_url}
                                alt={getPortfolioTitle(item, locale) || 'Portfolio image'}
                                className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105"
                                loading="lazy"
                                onError={(e) => {
                                  // 이미지 로드 실패 시 플레이스홀더로 대체
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="absolute inset-0 flex items-center justify-center">
                                        <div class="text-6xl font-black text-zinc-800 uppercase">
                                          ${item.category && item.category.length > 0 ? item.category[0].charAt(0) : 'E'}
                                        </div>
                                      </div>
                                      <div class="absolute top-4 left-4">
                                        <span class="px-3 py-1 bg-white text-black text-xs font-black uppercase rounded-none">
                                          ${item.category && item.category.length > 0 ? item.category[0] : 'ETC'}
                                        </span>
                                      </div>
                                    `
                                  }
                                }}
                              />
                              <div className="absolute top-4 left-4 z-10">
                                <span className="px-3 py-1 bg-white text-black text-xs font-black uppercase rounded-none">
                                  {item.category && item.category.length > 0 ? item.category[0] : 'ETC'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video bg-zinc-950 relative overflow-hidden">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center px-4">
                                  <div className="text-6xl font-black text-zinc-800 uppercase mb-2">
                                    {item.category && item.category.length > 0 
                                      ? item.category[0].charAt(0) 
                                      : 'E'}
                                  </div>
                                  <p className="text-xs text-zinc-400">{t('performanceNoImage')}</p>
                                </div>
                              </div>
                              <div className="absolute top-4 left-4 z-10">
                                <span className="px-3 py-1 bg-white text-black text-xs font-black uppercase rounded-none">
                                  {item.category && item.category.length > 0 ? item.category[0] : 'ETC'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Content */}
                          <div className="p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-black text-white mb-2 group-hover:text-white transition-colors break-keep">
                              {getPortfolioTitle(item, locale)}
                            </h3>
                            <p className="text-sm text-zinc-200 mb-4 leading-[1.5] tracking-tight break-keep block">
                              {getPortfolioClientName(item, locale)}
                            </p>

                            {/* Category Tags */}
                            {item.category && item.category.length > 0 && (
                              <div className="flex gap-2 flex-wrap pt-4 border-t border-zinc-700/50">
                                {item.category.map((cat, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 text-xs bg-white/10 text-white border border-zinc-700/50 rounded-none font-bold"
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* View All Link */}
          {portfolios.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/portfolio">
                <Button className="px-6 py-3 rounded-none font-black">
                  {t('performanceViewAll')}
                </Button>
              </Link>
            </div>
          )}
      </div>
    </section>
  )
}
