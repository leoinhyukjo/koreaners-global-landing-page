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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-black">
      {/* Background grid effect - subtle */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      <div className="container mx-auto px-5 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-4 text-balance break-keep transition-all duration-1000 leading-tight ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <span className="text-white">BEYOND</span>
          </h1>
          
          <h2 
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-12 sm:mb-16 text-balance break-keep transition-all duration-1000 delay-200 leading-tight ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <span className="text-white">AGENCY</span>
          </h2>
          
          <p 
            className={`text-lg sm:text-xl md:text-2xl text-zinc-400 mb-12 sm:mb-16 text-balance break-keep transition-all duration-1000 delay-300 font-medium ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            코리너스 글로벌
          </p>
          
          <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-1000 delay-500 ${
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
