'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-800">
      {/* Background grid effect - subtle */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* BEYOND AGENCY: 뒤쪽 글로우/블러 효과만 */}
          <div className="relative py-8 sm:py-10">
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              aria-hidden
            >
              <div className="w-[120%] max-w-[32rem] h-32 sm:h-40 md:h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[20rem] h-24 sm:h-28 bg-amber-400/20 rounded-full blur-2xl" />
            </div>
            <h1 
              className={`relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-2 text-balance break-keep transition-all duration-1000 leading-tight ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <span className="text-white">BEYOND</span>
            </h1>
            <h2 
              className={`relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-8 sm:mb-10 text-balance break-keep transition-all duration-1000 delay-200 leading-tight ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <span className="text-white">AGENCY</span>
            </h2>
          </div>
          
          {/* 브랜드 타이틀 */}
          <div className={`relative py-10 sm:py-12 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <h2 
              className="relative text-3xl sm:text-5xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance break-keep leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-amber-200/90"
            >
              코리너스 글로벌
              <span className="block mt-1 text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white/90">
                (KOREANERS GLOBAL)
              </span>
            </h2>
          </div>
          
          <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <a href="/contact">
              <Button size="lg" className="text-lg px-8 w-full sm:w-auto font-black">
                무료 상담 신청
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="/portfolio">
              <Button size="lg" variant="outline" className="text-lg px-8 w-full sm:w-auto font-black">
                성공 사례 보기
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
