'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { Menu, ChevronRight } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation, type TranslationKey } from '@/lib/translations'

function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0
  return window.innerWidth - document.documentElement.clientWidth
}

export default function Navigation() {
  const { locale, setLocale } = useLocale()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const scrollbarWidthRef = useRef(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const measure = () => {
      scrollbarWidthRef.current = getScrollbarWidth()
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const width = scrollbarWidthRef.current || getScrollbarWidth()
    if (width <= 0) return
    const prevBodyPaddingRight = document.body.style.paddingRight
    document.body.style.paddingRight = `${width}px`
    const nav = navRef.current
    const prevNavPaddingRight = nav?.style.paddingRight ?? ''
    if (nav) nav.style.paddingRight = `${width}px`
    return () => {
      document.body.style.paddingRight = prevBodyPaddingRight
      if (nav) nav.style.paddingRight = prevNavPaddingRight
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  type NavItem =
    | { href: string; label: string; labelKey?: never }
    | { href: string; labelKey: TranslationKey; label?: never }
  const menuItems: NavItem[] = [
    { href: '/service', label: 'Service' },
    { href: '/creator', label: 'Creator' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', labelKey: 'contact' },
  ]

  const effectiveLocale = mounted ? locale : 'ko'
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(effectiveLocale, key)

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full max-w-full overflow-hidden ${
        scrolled
          ? 'bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700/50'
          : 'bg-zinc-900/90 backdrop-blur-sm'
      }`}
      style={{ width: '100%' }}
    >
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-24">
        <div className="container mx-auto max-w-7xl py-3 sm:py-4">
        <div className="flex items-center justify-between min-w-0">
          <a href="/" className="hover:opacity-80 transition-opacity flex-shrink-0 flex items-center gap-2 sm:gap-3 min-w-0">
            <Logo variant="header" />
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-black text-white leading-tight truncate">KOREANERS GLOBAL</div>
              <div className="text-[10px] sm:text-xs text-zinc-300 mt-0.5 break-words">{t('tagline')}</div>
            </div>
          </a>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 flex-shrink-0">
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
            {menuItems.filter((m) => m.href !== '/contact').map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative text-zinc-200 hover:text-white transition-all duration-200 py-2 font-bold text-sm group whitespace-nowrap"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
            <a href="/contact" className="ml-1">
              <Button size="default" className="px-6 py-2.5 font-black whitespace-nowrap">
                {t('contact')}
              </Button>
            </a>
          </div>

          {/* Mobile: 언어 토글(헤더 고정) + 햄버거 메뉴 */}
          <div className="flex md:hidden items-center gap-2 flex-shrink-0 min-w-0">
            {/* 언어 토글: 화면 크기와 관계없이 항상 헤더 우측(햄버거 옆)에 노출 */}
            <div className="flex items-center gap-0.5 rounded border border-zinc-600 bg-zinc-800/50 p-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setLocale('ko')}
                className={`rounded px-2 py-1 text-xs font-bold transition-colors ${locale === 'ko' ? 'bg-white text-zinc-900' : 'text-zinc-300 hover:text-white'}`}
              >
                KR
              </button>
              <button
                type="button"
                onClick={() => setLocale('ja')}
                className={`rounded px-2 py-1 text-xs font-bold transition-colors ${locale === 'ja' ? 'bg-white text-zinc-900' : 'text-zinc-300 hover:text-white'}`}
              >
                JP
              </button>
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 min-w-[2.25rem] hover:bg-zinc-800 border-0 flex-shrink-0"
                  aria-label="메뉴 열기"
                >
                  <Menu className="h-5 w-5 text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[min(300px,100vw)] sm:w-[340px] max-w-full bg-black border-l border-zinc-800 z-50 rounded-none overflow-y-auto"
              >
                <SheetHeader className="border-b border-zinc-800 pb-4 mb-4 z-10 relative">
                  <SheetTitle className="text-left text-xl font-black text-white break-words">
                    {t('menu')}
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-0 relative z-10">
                  {menuItems.map((item, index) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center justify-between text-white hover:text-white hover:bg-zinc-900 active:bg-zinc-800 transition-all duration-200 py-4 px-5 rounded-none text-base sm:text-sm font-bold tracking-tight relative z-10 border-b border-zinc-800 break-words"
                      style={{
                        animation: `fadeInSlide 0.3s ease-out ${index * 60}ms both`,
                      }}
                    >
                      <span className="text-white transition-colors duration-200 font-bold break-words min-w-0">
                        {'labelKey' in item && item.labelKey ? t(item.labelKey) : item.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-zinc-400 flex-shrink-0 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
                    </a>
                  ))}
                </nav>
                
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
      </div>
    </nav>
  )
}
