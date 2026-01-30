'use client'

import { Navigation } from '@/components/navigation'
import { SafeHydration } from '@/components/common/SafeHydration'
import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import Link from 'next/link'
import { useLocale } from '@/contexts/locale-context'
import { getPortfolioTitle, getPortfolioClientName } from '@/lib/localized-content'
import { getTranslation } from '@/lib/translations'

const PortfolioSkeleton = () => (
  <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 min-h-screen" aria-hidden="true">
    <div className="container mx-auto max-w-7xl">
      <div className="text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12">
        <div className="h-12 sm:h-14 max-w-2xl mx-auto bg-zinc-800/50 rounded animate-pulse" />
        <div className="h-5 max-w-3xl mx-auto bg-zinc-800/50 rounded animate-pulse" />
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
    return category[0]
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
    <main className="min-h-screen bg-zinc-900">
      <Navigation />
      <SafeHydration fallback={<PortfolioSkeleton />}>
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-balance leading-tight">
              <span className="text-white">{t('portfolioPageHero1')}</span>
              <br />
              <span className="text-white">{t('portfolioPageHero2')}</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-200 max-w-3xl mx-auto text-pretty px-2">
              {t('portfolioPageHeroSub')}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-8 sm:mb-12 justify-center flex-wrap px-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-none font-bold transition-all text-sm sm:text-base min-h-[44px] ${
                  activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Portfolio Grid */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-zinc-200">{t('loading')}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-200 text-lg">
                {portfolios.length === 0 ? t('portfolioEmpty') : t('portfolioEmptyFilter')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-20">
              {filteredItems.map(item => (
                <Link key={item.id} href={`/portfolio/${item.id}`} className="block h-full">
                  <Card 
                    className="group overflow-hidden bg-zinc-800 border-zinc-700/50 hover:border-white transition-all duration-300 cursor-pointer h-full flex flex-col"
                  >
                    {/* Image */}
                    {item.thumbnail_url ? (
                      <div className="aspect-video relative overflow-hidden bg-zinc-800">
                        <img
                          src={item.thumbnail_url}
                          alt={getPortfolioTitle(item, locale)}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            // 이미지 로드 실패 시 플레이스홀더로 대체
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('.placeholder-fallback')) {
                              const placeholder = document.createElement('div')
                              placeholder.className = 'placeholder-fallback absolute inset-0 flex items-center justify-center bg-zinc-800'
                              placeholder.innerHTML = `
                                <div class="text-center px-4">
                                  <div class="text-4xl sm:text-6xl font-bold text-zinc-600 uppercase mb-2">
                                    ${getCategoryInitial(item.category)}
                                  </div>
                                  <p class="text-xs text-zinc-400">${noImageText}</p>
                                </div>
                              `
                              parent.appendChild(placeholder)
                            }
                          }}
                        />
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                          <span className="px-2 sm:px-3 py-1 bg-white text-black text-xs font-bold rounded-none uppercase">
                            {getCategoryDisplay(item.category)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center px-4">
                            <div className="text-4xl sm:text-6xl font-bold text-zinc-600 uppercase mb-2">
                              {getCategoryInitial(item.category)}
                            </div>
                            <p className="text-xs text-zinc-400">{noImageText}</p>
                          </div>
                        </div>
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                          <span className="px-2 sm:px-3 py-1 bg-white text-black text-xs font-bold rounded-none uppercase">
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
                      <p className="text-xs sm:text-sm text-zinc-200 mb-4 leading-relaxed">
                        {getPortfolioClientName(item, locale)}
                      </p>

                      {/* Category Tags */}
                      {item.category && item.category.length > 0 && (
                        <div className="mt-auto pt-3 sm:pt-4 border-t border-zinc-700/50 flex gap-2 flex-wrap">
                          {item.category.map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs rounded-none bg-white/10 text-white border border-zinc-700/50"
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
