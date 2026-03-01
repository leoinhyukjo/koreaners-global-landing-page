'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import Link from 'next/link'
import { SkeletonGrid } from '@/components/ui/skeleton-card'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { getPortfolioTitle, getPortfolioClientName } from '@/lib/localized-content'

export function Performance() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)

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
        .limit(3)

      if (error) throw error
      setPortfolios(data || [])
    } catch (error: any) {
      console.error('Error fetching portfolios:', error)
      setPortfolios([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="performance" className="bg-white py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <span className="text-xs uppercase tracking-[0.2em] text-black/40">PORTFOLIO</span>
        <h2 className="font-display font-black text-4xl lg:text-6xl uppercase mt-4 leading-[0.9] text-[#09090B]">
          {t('performanceTitle1')}{t('performanceTitle2')}
        </h2>

        {/* Portfolio Grid */}
        {loading ? (
          <div className="mt-16">
            <SkeletonGrid count={3} />
          </div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-20 mt-16">
            <p className="text-black/50 text-lg">
              {t('performanceEmpty')}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {portfolios.slice(0, 3).map((item) => (
                <Link key={item.id} href={`/portfolio/${item.id}`} className="group cursor-pointer">
                  <div className="aspect-video bg-[#F5F5F5] overflow-hidden border border-black/10">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={getPortfolioTitle(item, locale) || 'Portfolio image'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black/20 font-display font-black text-4xl">
                        {item.category?.[0]?.charAt(0) || 'P'}
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <span className="text-xs uppercase tracking-wider text-black/40">
                      {item.category && item.category.length > 0 ? item.category[0] : 'ETC'}
                    </span>
                    <h3 className="text-xl font-bold text-[#09090B] mt-1">
                      {getPortfolioTitle(item, locale)}
                    </h3>
                    <p className="text-sm text-black/50 mt-1">
                      {getPortfolioClientName(item, locale)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 text-center">
              <Link
                href="/portfolio"
                className="text-sm uppercase tracking-wider font-bold text-[#09090B] border-b border-black/30 hover:border-black pb-1 transition-colors duration-300"
              >
                {t('performanceViewAll')} →
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
