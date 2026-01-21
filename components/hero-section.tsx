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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 
            className={`text-5xl md:text-7xl font-bold mb-2 text-balance transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <span className="text-foreground">Beyond Agency</span>
          </h1>
          
          <p 
            className={`text-5xl md:text-7xl text-primary font-bold mb-12 text-balance transition-all duration-1000 delay-200 ${
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
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 w-full sm:w-auto">
                무료 상담 신청
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="/portfolio">
              <Button size="lg" variant="outline" className="text-lg px-8 border-primary text-foreground hover:bg-primary/10 bg-transparent w-full sm:w-auto">
                성공 사례 보기
              </Button>
            </a>
          </div>

          {/* 3D Grid Visualization */}
          <div className="relative mx-auto max-w-3xl h-64 mt-16">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-8 gap-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 border border-primary/30 rounded-lg hover:border-primary hover:bg-primary/10 transition-all duration-300"
                    style={{
                      animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </section>
  )
}
