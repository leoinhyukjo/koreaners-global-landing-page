'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Performance() {
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
    <section id="performance" className="py-12 sm:py-16 relative bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 border-t border-zinc-700/50">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-balance break-keep">
              <span className="text-white">검증된 </span>
              <span className="text-white">성과</span>
            </h2>
            <p className="text-lg text-zinc-200 mb-8 break-keep max-w-prose mx-auto">
              다양한 산업군에서 탁월한 결과를 만들어냈습니다
            </p>
          </div>

          {/* Portfolio Carousel */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-zinc-200">로딩 중...</p>
            </div>
          ) : portfolios.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-200 text-lg">
                등록된 포트폴리오가 없습니다.
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
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-20 w-10 h-10 bg-zinc-800/95 backdrop-blur-sm border-zinc-700/50 hover:bg-white hover:text-black hover:border-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                  aria-label="이전 슬라이드"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollNext}
                  disabled={nextBtnDisabled}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-20 w-10 h-10 bg-zinc-800/95 backdrop-blur-sm border-zinc-700/50 hover:bg-white hover:text-black hover:border-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                  aria-label="다음 슬라이드"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Carousel Container */}
              <div className="overflow-hidden px-0 lg:px-12" ref={emblaRef}>
                <div className="flex gap-4">
                  {portfolios.map(item => (
                    <div key={item.id} className="flex-[0_0_100%] md:flex-[0_0_calc(50%-8px)] lg:flex-[0_0_calc(33.333%-11px)] min-w-0">
                      <Link href={`/portfolio/${item.id}`}>
                        <Card 
                          className="group overflow-hidden bg-zinc-800 border-zinc-700/50 hover:border-white transition-all duration-200 cursor-pointer h-full rounded-none"
                        >
                          {/* Image */}
                          {item.thumbnail_url ? (
                            <div className="aspect-video relative overflow-hidden bg-zinc-950">
                              <img
                                src={item.thumbnail_url}
                                alt={item.title || 'Portfolio image'}
                                className="w-full h-full object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-105"
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
                                <div className="text-6xl font-black text-zinc-800 uppercase">
                                  {item.category && item.category.length > 0 
                                    ? item.category[0].charAt(0) 
                                    : 'E'}
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
                              {item.title}
                            </h3>
                            <p className="text-sm text-zinc-200 mb-4 leading-relaxed break-keep">
                              {item.client_name}
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
                  전체 포트폴리오 보기
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
