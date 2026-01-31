'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, Users, ShoppingBag } from 'lucide-react'
import { FadeIn } from '@/components/ui/fade-in'
import { Counter } from '@/components/ui/counter'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

export function MarketOpportunity() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const stats = [
    { icon: Users, titleKey: 'marketStat1Title' as const, subtitleKey: 'marketStat1Subtitle' as const, descKey: 'marketStat1Desc' as const },
    { icon: ShoppingBag, titleKey: 'marketStat2Title' as const, subtitleKey: 'marketStat2Subtitle' as const, descKey: 'marketStat2Desc' as const },
    { icon: TrendingUp, titleKey: 'marketStat3Title' as const, subtitleKey: 'marketStat3Subtitle' as const, descKey: 'marketStat3Desc' as const },
  ]

  return (
    <section id="market" className="py-12 sm:py-16 relative bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-800 w-full max-w-full overflow-hidden">
      <div className="container mx-auto max-w-7xl w-full max-w-full px-4 sm:px-6 overflow-hidden">
          <div className="text-center mb-12 block">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 text-balance break-keep break-words leading-[1.2] tracking-tight min-h-[2.4em] block">
              <span className="text-white block">{t('marketTitle1')}</span>
              <span className="text-white block">{t('marketTitle2')}</span>
            </h2>
            <p className="text-lg text-zinc-200 break-keep max-w-prose mx-auto leading-[1.5] tracking-tight block min-h-[1.5em]">
              {t('marketSubtitle')}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <FadeIn key={index} delay={index * 0.1}>
              <Card
                key={index}
                className="relative p-6 bg-zinc-800 border-zinc-700/50 hover:border-white hover:-translate-y-1 transition-all duration-200 group overflow-hidden rounded-none"
              >
                <div className="relative z-10">
                  <div className="mb-4">
                    <stat.icon className="w-10 h-10 text-white" />
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-xs text-zinc-300 mb-1 font-medium">
                      {t(stat.titleKey)}
                    </div>
                    <div className="text-4xl font-black text-white mb-1">
                      {index === 0 ? <><Counter end={500} />{locale === 'ja' ? '万' : '만'}</> : 
                       index === 1 ? <><Counter end={25} />%</> : 
                       <><Counter end={90} />%</>}
                    </div>
                    <div className="text-base text-white font-bold">
                      {t(stat.subtitleKey)}
                    </div>
                  </div>
                  
                  <p className="text-zinc-200 text-sm leading-[1.5] tracking-tight break-keep block">
                    {t(stat.descKey)}
                  </p>
                </div>
              </Card>
              </FadeIn>
            ))}
          </div>
      </div>
    </section>
  )
}
