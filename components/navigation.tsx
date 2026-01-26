'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, ChevronRight } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function Navigation() {
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 하이드레이션 에러 방지를 위한 마운트 체크
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [mounted])

  const menuItems = [
    { href: '/service', label: 'Service' },
    { href: '/creator', label: 'Creator' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/blog', label: 'Blog' },
  ]

  // 하이드레이션 전에는 구조적 알맹이(링크, 버튼 등)를 절대 렌더링하지 않음
  // 최소한의 높이만 가진 빈 박스로 레이아웃 시프트 방지
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="container mx-auto px-5 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              KOREANERS<span className="text-foreground"> GLOBAL</span>
            </div>
            <div className="h-9 w-9"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-lg border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              KOREANERS<span className="text-foreground"> GLOBAL</span>
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              당신의 글로벌 비즈니스 파트너
            </div>
          </a>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative text-foreground/90 hover:text-foreground transition-all duration-200 py-2 font-medium text-sm group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
              </a>
            ))}
            <a href="/contact" className="ml-2">
              <Button 
                size="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 px-6 py-2.5 shadow-[0_0_15px_rgba(217,255,0,0.3)] hover:shadow-[0_0_25px_rgba(217,255,0,0.5)] transition-all duration-200 font-semibold"
              >
                문의하기
              </Button>
            </a>
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <a href="/contact" className="mr-1">
              <Button 
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3 py-1.5 h-auto font-semibold shadow-[0_0_10px_rgba(217,255,0,0.2)]"
              >
                문의
              </Button>
            </a>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-accent/50"
                  aria-label="메뉴 열기"
                >
                  <Menu className="h-5 w-5 text-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[300px] sm:w-[340px] bg-background border-l border-border z-50"
              >
                <SheetHeader className="border-b border-border pb-4 mb-4 z-10 relative">
                  <SheetTitle className="text-left text-xl font-bold text-foreground">
                    메뉴
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-2 relative z-10">
                  {menuItems.map((item, index) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center justify-between text-foreground hover:text-primary hover:bg-accent/30 active:bg-accent/50 transition-all duration-200 py-4 px-5 rounded-xl text-base font-medium tracking-tight relative z-10"
                      style={{
                        animation: `fadeInSlide 0.3s ease-out ${index * 60}ms both`,
                      }}
                    >
                      <span className="text-foreground group-hover:text-primary transition-colors duration-200 font-medium">
                        {item.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                    </a>
                  ))}
                  
                  {/* 문의하기 버튼 - 강조 */}
                  <div className="mt-8 pt-8 border-t border-border relative z-10">
                    <div className="flex justify-center">
                      <a
                        href="/contact"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full max-w-[240px]"
                      >
                        <Button 
                          size="lg"
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] shadow-sm hover:shadow-md transition-all duration-200 font-semibold text-base py-4 px-6 rounded-xl border border-primary/20"
                        >
                          문의하기
                        </Button>
                      </a>
                    </div>
                  </div>
                </nav>
                
                {/* 애니메이션 스타일 */}
                <style jsx>{`
                  @keyframes fadeInSlide {
                    from {
                      opacity: 0;
                      transform: translateX(1rem);
                    }
                    to {
                      opacity: 1;
                      transform: translateX(0);
                    }
                  }
                `}</style>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
