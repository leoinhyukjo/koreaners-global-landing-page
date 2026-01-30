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
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

export function Navigation() {
  const { locale, setLocale } = useLocale()
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

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  // 하이드레이션 전에는 구조적 알맹이(링크, 버튼 등)를 절대 렌더링하지 않음
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-24 bg-zinc-800 rounded" />
            <div className="h-9 w-16" />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700/50'
          : 'bg-zinc-900/90 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="hover:opacity-80 transition-opacity flex-shrink-0 flex items-center gap-2 sm:gap-3">
            <img src="/favicon.png" alt="KOREANERS GLOBAL" className="h-7 sm:h-8 w-auto object-contain" />
            <div>
              <div className="text-lg sm:text-xl font-black text-white leading-tight">KOREANERS GLOBAL</div>
              <div className="text-[10px] sm:text-xs text-zinc-300 mt-0.5">{t('tagline')}</div>
            </div>
          </a>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-1 rounded-md border border-zinc-600 bg-zinc-800/50 p-0.5">
              <button
                type="button"
                onClick={() => setLocale('ko')}
                className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${locale === 'ko' ? 'bg-white text-zinc-900' : 'text-zinc-300 hover:text-white'}`}
              >
                KR
              </button>
              <button
                type="button"
                onClick={() => setLocale('ja')}
                className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${locale === 'ja' ? 'bg-white text-zinc-900' : 'text-zinc-300 hover:text-white'}`}
              >
                JP
              </button>
            </div>
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative text-zinc-200 hover:text-white transition-all duration-200 py-2 font-bold text-sm group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
              </a>
            ))}
            <a href="/contact" className="ml-1">
              <Button size="default" className="px-6 py-2.5 font-black">
                {t('contact')}
              </Button>
            </a>
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex items-center gap-0.5 rounded border border-zinc-600 bg-zinc-800/50 p-0.5">
              <button
                type="button"
                onClick={() => setLocale('ko')}
                className={`rounded px-2 py-1 text-xs font-bold ${locale === 'ko' ? 'bg-white text-zinc-900' : 'text-zinc-300'}`}
              >
                KR
              </button>
              <button
                type="button"
                onClick={() => setLocale('ja')}
                className={`rounded px-2 py-1 text-xs font-bold ${locale === 'ja' ? 'bg-white text-zinc-900' : 'text-zinc-300'}`}
              >
                JP
              </button>
            </div>
            <a href="/contact" className="mr-1">
              <Button size="sm" className="text-xs px-3 py-1.5 h-auto font-black">
                {t('contactShort')}
              </Button>
            </a>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-zinc-900 border-0"
                  aria-label="메뉴 열기"
                >
                  <Menu className="h-5 w-5 text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[300px] sm:w-[340px] bg-black border-l border-zinc-800 z-50 rounded-none"
              >
                <SheetHeader className="border-b border-zinc-800 pb-4 mb-4 z-10 relative">
                  <SheetTitle className="text-left text-xl font-black text-white">
                    {t('menu')}
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-2 relative z-10">
                  {menuItems.map((item, index) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center justify-between text-white hover:text-white hover:bg-zinc-900 active:bg-zinc-800 transition-all duration-200 py-4 px-5 rounded-none text-base font-bold tracking-tight relative z-10 border-b border-zinc-800"
                      style={{
                        animation: `fadeInSlide 0.3s ease-out ${index * 60}ms both`,
                      }}
                    >
                      <span className="text-white transition-colors duration-200 font-bold">
                        {item.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
                    </a>
                  ))}
                  
                  {/* 문의하기 버튼 - 강조 */}
                  <div className="mt-8 pt-8 border-t border-zinc-800 relative z-10">
                    <div className="flex justify-center">
                      <a
                        href="/contact"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full max-w-[240px]"
                      >
                        <Button 
                          size="lg"
                          className="w-full font-black text-base py-4 px-6 rounded-none"
                        >
                          {t('contact')}
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
