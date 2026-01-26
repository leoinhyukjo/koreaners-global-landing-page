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
    if (!emblaApi) return

    const onSelect = () => {
      setPrevBtnDisabled(!emblaApi.canScrollPrev())
      setNextBtnDisabled(!emblaApi.canScrollNext())
    }

    emblaApi.on('select', onSelect)
    onSelect()
  }, [emblaApi])

  return (
    <section id="performance" className="py-24 relative bg-card/20">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-balance break-keep">
              <span className="text-foreground">검증된 </span>
              <span className="text-primary">성과</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 break-keep max-w-prose mx-auto px-2">
              다양한 산업군에서 탁월한 결과를 만들어냈습니다
            </p>
          </div>

          {/* Portfolio Carousel */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : portfolios.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                등록된 포트폴리오가 없습니다.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Navigation Buttons - Desktop Only */}
              <div className="hidden md:block">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollPrev}
                  disabled={prevBtnDisabled}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full w-12 h-12 bg-background/80 backdrop-blur-sm border-border hover:bg-background hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="이전 슬라이드"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollNext}
                  disabled={nextBtnDisabled}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full w-12 h-12 bg-background/80 backdrop-blur-sm border-border hover:bg-background hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="다음 슬라이드"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>

              {/* Carousel Container */}
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-6">
                  {portfolios.map(item => (
                    <div key={item.id} className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)]">
                      <Link href={`/portfolio/${item.id}`}>
                        <Card 
                          className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer h-full shadow-lg hover:shadow-[0_0_30px_rgba(217,255,0,0.15)]"
                        >
                          {/* Image */}
                          {item.thumbnail_url ? (
                            <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                              <img
                                src={item.thumbnail_url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase backdrop-blur-sm">
                                  {item.category && item.category.length > 0 ? item.category[0] : 'etc'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-6xl font-bold text-primary/20 uppercase">
                                  {item.category && item.category.length > 0 
                                    ? item.category[0].charAt(0) 
                                    : 'E'}
                                </div>
                              </div>
                              <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase">
                                  {item.category && item.category.length > 0 ? item.category[0] : 'etc'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Content */}
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors break-keep">
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed break-keep">
                              {item.client_name}
                            </p>

                            {/* Category Tags */}
                            {item.category && item.category.length > 0 && (
                              <div className="flex gap-2 flex-wrap pt-4 border-t border-border">
                                {item.category.map((cat, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
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
                <Button className="px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium">
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
