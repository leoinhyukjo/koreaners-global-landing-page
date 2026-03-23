'use client'

import Navigation from '@/components/navigation'
import { SafeHydration } from '@/components/common/SafeHydration'
import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import Link from 'next/link'
import { useLocale } from '@/contexts/locale-context'
import { getPortfolioTitle, getPortfolioClientName } from '@/lib/localized-content'
import { getTranslation } from '@/lib/translations'
import { SectionTag } from '@/components/ui/section-tag'
import Image from 'next/image'

const PortfolioSkeleton = () => (
<section className="pt-32 sm:pt-40 pb-12 sm:pb-16 px-6 lg:px-24 min-h-screen" aria-hidden="true">
  <div className="max-w-7xl mx-auto">
      <div className="mb-12 sm:mb-16">
        <div className="h-7 w-28 bg-card/50 rounded-full animate-pulse mb-6" />
        <div className="h-12 sm:h-14 max-w-2xl bg-card/50 rounded animate-pulse" />
        <div className="h-5 max-w-xl bg-card/50 rounded animate-pulse mt-6" />
      </div>
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent" />
      </div>
    </div>
  </section>
)

export default function PortfolioPage() {
  const { locale } = useLocale()
  const [activeTab, setActiveTab] = useState('all')
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const noImageText = t('performanceNoImage')

  useEffect(() => {
    fetchPortfolios()
  }, [])

  async function fetchPortfolios() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setPortfolios(data || [])
    } catch (error: any) {
      console.error('Error fetching portfolios:', error)
    } finally {
      setLoading(false)
    }
  }

  // 카테고리 필터링 (대소문자 구분)
  const filteredItems = activeTab === 'all'
    ? portfolios
    : portfolios.filter(item => {
        if (!item.category || !Array.isArray(item.category)) return false
        return item.category.some(cat => {
          // activeTab과 정확히 일치하거나, F&B의 경우 'F&B' 또는 'fb' 모두 허용
          if (activeTab === 'F&B' || activeTab === 'fb') {
            return cat === 'F&B' || cat === 'fb'
          }
          return cat === activeTab
        })
      })

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'Beauty', label: 'Beauty' },
    { id: 'F&B', label: 'F&B' },
    { id: 'Fashion', label: 'Fashion' },
    { id: 'etc', label: 'etc' },
  ]

  // 카테고리 표시용 함수
  function getCategoryDisplay(category: string[] | null): string {
    if (!category || category.length === 0) return 'etc'
    return category[0] ?? 'etc'
  }

  // 카테고리 첫 글자 가져오기
  function getCategoryInitial(category: string[] | null): string {
    if (!category || category.length === 0) return 'E'
    const firstCat = category[0]
    if (firstCat === 'Beauty') return 'B'
    if (firstCat === 'Fashion') return 'F'
    if (firstCat === 'F&B' || firstCat === 'fb') return 'F&B'
    return 'E'
  }

  return (
    <main className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      <Navigation />
      <SafeHydration fallback={<PortfolioSkeleton />}>
      {/* Hero Section */}
<section className="pt-32 sm:pt-40 pb-12 sm:pb-16 py-24 md:py-32 lg:py-40 px-6 lg:px-24 relative overflow-hidden hero-glow">
      <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-12 sm:mb-16">
            <SectionTag variant="dark">PORTFOLIO</SectionTag>
            <div className="mt-6" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              <span>{t('portfolioPageHero1')}</span>
              <br />
              <span>{t('portfolioPageHero2')}</span>
            </h1>
            <p className="text-lg text-[#A8A29E] max-w-2xl mt-6">
              {t('portfolioPageHeroSub')}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-8 sm:mb-12 flex-wrap px-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-[var(--radius-sm)] font-bold transition-all text-sm sm:text-base min-h-[44px] ${
                  activeTab === tab.id
                    ? 'gradient-warm text-white'
                    : 'bg-card text-[#A8A29E] hover:bg-white/10 border border-[var(--border)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Portfolio Grid */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-white/80">{t('loading')}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/80 text-lg">
                {portfolios.length === 0 ? t('portfolioEmpty') : t('portfolioEmptyFilter')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-20">
              {filteredItems.map(item => (
                <Link key={item.id} href={`/portfolio/${item.id}`} className="block h-full">
                  <Card
                    className="group overflow-hidden bg-card border border-border hover:border-[#FF4500]/60 transition-all duration-300 cursor-pointer h-full flex flex-col"
                  >
                    {/* Image */}
                    {item.thumbnail_url ? (
                      <div className="aspect-video relative overflow-hidden bg-card">
                        <Image
                          src={item.thumbnail_url}
                          alt={getPortfolioTitle(item, locale)}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                          <span className="px-2 sm:px-3 py-1 bg-[#FF4500]/10 text-[#FF4500] text-xs font-bold rounded-full uppercase">
                            {getCategoryDisplay(item.category)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-card relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center px-4">
                            <div className="text-4xl sm:text-6xl font-bold text-white/30 uppercase mb-2">
                              {getCategoryInitial(item.category)}
                            </div>
                            <p className="text-xs text-[#A8A29E]">{noImageText}</p>
                          </div>
                        </div>
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                          <span className="px-2 sm:px-3 py-1 bg-[#FF4500]/10 text-[#FF4500] text-xs font-bold rounded-full uppercase">
                            {getCategoryDisplay(item.category)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 sm:p-6 flex-1 flex flex-col">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                        {getPortfolioTitle(item, locale)}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#A8A29E] mb-4 leading-relaxed">
                        {getPortfolioClientName(item, locale)}
                      </p>

                      {/* Category Tags */}
                      {item.category && item.category.length > 0 && (
                        <div className="mt-auto pt-3 sm:pt-4 border-t border-border flex gap-2 flex-wrap">
                          {item.category.map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs rounded-full bg-white/10 text-[#A8A29E] border border-[var(--border)]"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      </SafeHydration>
    </main>
  )
}
