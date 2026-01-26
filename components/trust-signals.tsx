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
    <section className="py-12 sm:py-16 relative overflow-hidden bg-black border-t border-zinc-800">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-white break-keep">
            TRUSTED BY
          </h2>
          <p className="text-zinc-400 text-lg break-keep max-w-prose mx-auto">
            신뢰와 열정을 바탕으로 함께 성장해온 소중한 파트너들입니다
          </p>
        </div>

        <div className="space-y-4">
          {/* First Row - Scroll Right */}
          <div 
            ref={scrollRef1}
            className="flex gap-4 overflow-x-hidden py-4"
            style={{ scrollBehavior: 'auto' }}
          >
            {duplicatedRow1.map((partner, index) => (
              <div
                key={`row1-${partner}-${index}`}
                className="flex-shrink-0 px-8 py-6 bg-zinc-900 border border-zinc-800 rounded-none hover:border-white hover:scale-105 transition-all duration-200"
                style={{ minWidth: '200px' }}
              >
                <div className="text-center">
                  <span className="text-lg font-bold text-white">
                    {partner}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Second Row - Scroll Left */}
          <div 
            ref={scrollRef2}
            className="flex gap-4 overflow-x-hidden py-4"
            style={{ scrollBehavior: 'auto' }}
          >
            {duplicatedRow2.map((partner, index) => (
              <div
                key={`row2-${partner}-${index}`}
                className="flex-shrink-0 px-8 py-6 bg-zinc-900 border border-zinc-800 rounded-none hover:border-white hover:scale-105 transition-all duration-200"
                style={{ minWidth: '200px' }}
              >
                <div className="text-center">
                  <span className="text-lg font-bold text-white">
                    {partner}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-400 break-keep">
            코리너스 글로벌은 <span className="text-white font-bold">수출바우처 공식 수행기관</span>입니다.
          </p>
        </div>
      </div>
    </section>
  )
}
