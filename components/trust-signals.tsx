'use client'

import { useEffect, useRef } from 'react'

export function TrustSignals() {
  const scrollRef1 = useRef<HTMLDivElement>(null)
  const scrollRef2 = useRef<HTMLDivElement>(null)

  const partnersRow1 = [
    'LG생활건강', '아모레퍼시픽', 'CJ제일제당', '오리온', '농심',
    '빙그레', '매일유업', 'SPC그룹'
  ]

  const partnersRow2 = [
    '롯데제과', '동서식품', '하이트진로', '코오롱FnC', 'LF', 
    '한섬', '휠라코리아', '네이처리퍼블릭'
  ]

  // Duplicate for seamless loop
  const duplicatedRow1 = [...partnersRow1, ...partnersRow1, ...partnersRow1]
  const duplicatedRow2 = [...partnersRow2, ...partnersRow2, ...partnersRow2]

  useEffect(() => {
    const scrollContainer1 = scrollRef1.current
    const scrollContainer2 = scrollRef2.current
    if (!scrollContainer1 || !scrollContainer2) return

    let animationId: number
    let scrollPosition1 = 0
    let scrollPosition2 = 0
    const scrollSpeed = 0.8

    const animate = () => {
      // First row - scroll right
      scrollPosition1 += scrollSpeed
      if (scrollPosition1 >= scrollContainer1.scrollWidth / 3) {
        scrollPosition1 = 0
      }
      scrollContainer1.scrollLeft = scrollPosition1

      // Second row - scroll left (opposite direction)
      scrollPosition2 -= scrollSpeed
      if (scrollPosition2 <= 0) {
        scrollPosition2 = scrollContainer2.scrollWidth / 3
      }
      scrollContainer2.scrollLeft = scrollPosition2

      animationId = requestAnimationFrame(animate)
    }

    // Initialize second row position
    scrollContainer2.scrollLeft = scrollContainer2.scrollWidth / 3

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            TRUSTED BY
          </h2>
          <p className="text-muted-foreground text-lg">
            신뢰와 열정을 바탕으로 함께 성장해온 소중한 파트너들입니다
          </p>
        </div>

        <div className="space-y-6">
          {/* First Row - Scroll Right */}
          <div 
            ref={scrollRef1}
            className="flex gap-6 overflow-x-hidden py-4"
            style={{ scrollBehavior: 'auto' }}
          >
            {duplicatedRow1.map((partner, index) => (
              <div
                key={`row1-${partner}-${index}`}
                className="flex-shrink-0 px-8 py-6 bg-card/50 border border-border rounded-xl hover:border-primary/50 hover:scale-105 transition-all duration-300"
                style={{ minWidth: '200px' }}
              >
                <div className="text-center">
                  <span className="text-lg font-semibold text-foreground">
                    {partner}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Second Row - Scroll Left */}
          <div 
            ref={scrollRef2}
            className="flex gap-6 overflow-x-hidden py-4"
            style={{ scrollBehavior: 'auto' }}
          >
            {duplicatedRow2.map((partner, index) => (
              <div
                key={`row2-${partner}-${index}`}
                className="flex-shrink-0 px-8 py-6 bg-card/50 border border-border rounded-xl hover:border-primary/50 hover:scale-105 transition-all duration-300"
                style={{ minWidth: '200px' }}
              >
                <div className="text-center">
                  <span className="text-lg font-semibold text-foreground">
                    {partner}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            코리너스 글로벌은 <span className="text-primary font-semibold">수출바우처 공식 수행기관</span>입니다.
          </p>
        </div>
      </div>
    </section>
  )
}
