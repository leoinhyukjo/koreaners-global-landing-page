'use client'

import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in'
import { SectionTag } from '@/components/ui/section-tag'
import { CountUp } from '@/components/ui/count-up'

const stats = [
  { end: 300, suffix: '+', key: 'finalCtaStat2' as const },
  { end: 30, suffix: null, key: 'finalCtaStat3' as const },
  { end: 250, suffix: '%', key: 'finalCtaStat4' as const },
]

export function FinalCTA() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const getMansuffix = (index: number) => index === 1 ? (locale === 'ja' ? '万+' : '만+') : null

  return (
    <section className="bg-[var(--kn-light)] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <SectionTag variant="light">RESULTS</SectionTag>
          <h2 className="font-display font-bold text-4xl lg:text-6xl uppercase mt-6 leading-[0.9] text-[var(--kn-dark)]">
            {t('finalCtaTitle1')}<br />
            {t('finalCtaTitle2')}
          </h2>
        </FadeIn>

        {/* Stats Grid */}
        <StaggerContainer staggerDelay={0.1} className="grid grid-cols-3 gap-8 mt-16">
          {stats.map((stat, index) => (
            <StaggerItem key={stat.key}>
              <div className={`${index < stats.length - 1 ? 'border-r border-[var(--kn-dark)]/10' : ''}`}>
                <div className="font-display font-bold text-6xl lg:text-8xl gradient-warm-text leading-none">
                  <CountUp
                    end={stat.end}
                    suffix={getMansuffix(index) ?? stat.suffix ?? ''}
                    className="font-display font-bold text-6xl lg:text-8xl gradient-warm-text leading-none"
                  />
                </div>
                <div className="text-sm text-[#78716C] mt-3 uppercase tracking-wider">
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
