'use client'

import { FadeIn } from '@/components/ui/fade-in'
import { Counter } from '@/components/ui/counter'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

export function MarketOpportunity() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  const stats = [
    { titleKey: 'marketStat1Title' as const, subtitleKey: 'marketStat1Subtitle' as const, descKey: 'marketStat1Desc' as const },
    { titleKey: 'marketStat2Title' as const, subtitleKey: 'marketStat2Subtitle' as const, descKey: 'marketStat2Desc' as const },
    { titleKey: 'marketStat3Title' as const, subtitleKey: 'marketStat3Subtitle' as const, descKey: 'marketStat3Desc' as const },
  ]

  return (
    <section id="market" className="bg-white py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left column — Text */}
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-black/40">
              MARKET OPPORTUNITY
            </span>
            <div className="w-12 h-0.5 bg-[#FF4500] mt-3 mb-6" />
            <h2 className="font-display font-black text-5xl lg:text-7xl uppercase leading-[0.9] text-[#09090B] max-w-md">
              <span className="block">{t('marketTitle1')}</span>
              <span className="block">{t('marketTitle2')}</span>
            </h2>
            <p className="text-lg text-black/70 leading-relaxed mt-6">
              {t('marketSubtitle')}
            </p>
          </div>

          {/* Right column — 3 stat cards stacked */}
          <div className="flex flex-col gap-4">
            {stats.map((stat, index) => (
              <FadeIn key={index} delay={index * 0.1}>
                <div className="bg-[#F5F5F5] border border-black/10 p-8">
                  <div className="text-xs text-black/60 mb-1 font-medium uppercase tracking-wider">
                    {t(stat.titleKey)}
                  </div>
                  <div className="font-display font-black text-5xl text-[#FF4500]">
                    {index === 0 ? <><Counter end={500} />{locale === 'ja' ? '万' : '만'}</> :
                     index === 1 ? <><Counter end={25} />%</> :
                     <><Counter end={90} />%</>}
                  </div>
                  <div className="text-sm text-black/60 mt-2">
                    {t(stat.descKey)}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
