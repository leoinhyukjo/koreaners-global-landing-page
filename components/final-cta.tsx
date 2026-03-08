'use client'

import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in'
import { SectionTag } from '@/components/ui/section-tag'

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
    <section className="bg-[var(--kn-dark)] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <SectionTag variant="dark">RESULTS</SectionTag>
          <h2 className="font-display font-bold text-4xl lg:text-6xl uppercase mt-6 leading-[0.9] text-[var(--foreground)]">
            {t('finalCtaTitle1')}<br />
            {t('finalCtaTitle2')}
          </h2>
        </FadeIn>

        {/* Stats Grid */}
        <StaggerContainer staggerDelay={0.1} className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {stats.map((stat, index) => (
            <StaggerItem key={stat.key}>
              <div className={`${index < stats.length - 1 ? 'border-r border-[var(--border)]' : ''}`}>
                <div className="font-display font-bold text-6xl lg:text-8xl gradient-warm-text leading-none">
                  {typeof stat.value === 'function' ? stat.value(locale) : stat.value}
                </div>
                <div className="text-sm text-[#A8A29E] mt-3 uppercase tracking-wider">
                  {t(stat.key)}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
