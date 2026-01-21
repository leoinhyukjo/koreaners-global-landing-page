'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-lg border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="hover:opacity-80 transition-opacity">
            <div className="text-2xl font-bold text-primary">
              KOREANERS<span className="text-foreground"> GLOBAL</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              당신의 글로벌 비즈니스 파트너
            </div>
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="/service" className="text-foreground hover:text-primary transition-colors">
              Service
            </a>
            <a href="/creator" className="text-foreground hover:text-primary transition-colors">
              Creator
            </a>
            <a href="/portfolio" className="text-foreground hover:text-primary transition-colors">
              Portfolio
            </a>
            <a href="/contact">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 shadow-[0_0_15px_rgba(217,255,0,0.3)] hover:shadow-[0_0_25px_rgba(217,255,0,0.5)] transition-all">
                문의하기
              </Button>
            </a>
          </div>
          <a href="/contact" className="md:hidden">
            <Button className="bg-primary text-primary-foreground">
              문의
            </Button>
          </a>
        </div>
      </div>
    </nav>
  )
}
