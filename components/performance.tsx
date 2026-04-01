'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import Link from 'next/link'
import { SkeletonGrid } from '@/components/ui/skeleton-card'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { getPortfolioTitle, getPortfolioClientName } from '@/lib/localized-content'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in'
import { SectionTag } from '@/components/ui/section-tag'
import { GlassCard } from '@/components/ui/glass-card'
import { TiltCard } from '@/components/ui/tilt-card'
import { AuroraBackground } from '@/components/ui/aurora-background'
import Image from 'next/image'

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
    <section id="performance" className="relative overflow-hidden bg-[var(--kn-dark)] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <AuroraBackground
        blobs={[
          { color: 'rgba(255,69,0,0.06)', size: 500, top: '10%', left: '70%', animation: 'aurora-float', duration: '20s' },
        ]}
        withDotPattern={false}
      />
      <div className="relative z-10 max-w-7xl mx-auto">
        <FadeIn>
          <SectionTag variant="dark">PORTFOLIO</SectionTag>
          <h2 className="font-display font-bold text-4xl lg:text-6xl uppercase mt-6 leading-[0.9] text-[var(--kn-light)] max-w-md">
            {t('performanceTitle1')}{t('performanceTitle2')}
          </h2>
        </FadeIn>

        {loading ? (
          <div className="mt-16">
            <SkeletonGrid count={3} />
          </div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-20 mt-16">
            <p className="text-[#78716C] text-lg">
              {t('performanceEmpty')}
            </p>
          </div>
        ) : (
          <>
            <StaggerContainer staggerDelay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {portfolios.slice(0, 3).map((item) => (
                <StaggerItem key={item.id}>
                  <TiltCard>
                    <Link href={`/portfolio/${item.id}`} className="group cursor-pointer block">
                      <div className="relative aspect-video bg-[var(--kn-card-dark)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--kn-light)]/10">
                        {item.thumbnail_url ? (
                          <Image
                            src={item.thumbnail_url}
                            alt={getPortfolioTitle(item, locale) || 'Portfolio image'}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--kn-light)]/20 font-display font-bold text-4xl">
                            {item.category?.[0]?.charAt(0) || 'P'}
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <span className="text-xs uppercase tracking-wider text-[#FF4500]">
                          {item.category && item.category.length > 0 ? item.category[0] : 'ETC'}
                        </span>
                        <h3 className="text-xl font-bold text-[var(--kn-light)] mt-1 group-hover:text-[#FF4500] transition-colors duration-300">
                          {getPortfolioTitle(item, locale)}
                        </h3>
                        <p className="text-sm text-[#78716C] mt-1">
                          {getPortfolioClientName(item, locale)}
                        </p>
                      </div>
                    </Link>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <FadeIn delay={0.3}>
              <div className="mt-12 text-center">
                <Link
                  href="/portfolio"
                  className="text-sm uppercase tracking-wider font-bold text-[var(--kn-light)] border-b border-[var(--kn-light)]/30 hover:border-[#FF4500] hover:text-[#FF4500] pb-1 transition-colors duration-300"
                >
                  {t('performanceViewAll')} →
                </Link>
              </div>
            </FadeIn>
          </>
        )}
      </div>
    </section>
  )
}
