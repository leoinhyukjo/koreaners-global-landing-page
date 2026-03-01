'use client'

import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

const stats = [
  { value: '300+', key: 'finalCtaStat1' as const },
  { value: '105', key: 'finalCtaStat2' as const },
  { value: (locale: string) => (locale === 'ja' ? '30万' : '30만'), key: 'finalCtaStat3' as const },
  { value: '250%', key: 'finalCtaStat4' as const },
]

export function FinalCTA() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  return (
    <section className="bg-black py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <span className="text-xs uppercase tracking-[0.2em] text-white/40">RESULTS</span>
        <h2 className="font-display font-black text-4xl lg:text-6xl uppercase mt-4 leading-[0.9] text-white">
          {t('finalCtaTitle1')}<br />
          {t('finalCtaTitle2')}
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {stats.map((stat, index) => (
            <div
              key={stat.key}
              className={`${index < stats.length - 1 ? 'border-r border-white/10' : ''}`}
            >
              <div className="font-display font-black text-6xl lg:text-8xl text-white leading-none">
                {typeof stat.value === 'function' ? stat.value(locale) : stat.value}
              </div>
              <div className="text-sm text-white/50 mt-3 uppercase tracking-wider">
                {t(stat.key)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
