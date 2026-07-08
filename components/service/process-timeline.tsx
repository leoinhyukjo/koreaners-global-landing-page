'use client'

import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { SectionTag } from '@/components/ui/section-tag'

const STEPS = [
  { num: '01', titleKey: 'solutionStep1Title' as const, descKey: 'solutionStep1Desc' as const },
  { num: '02', titleKey: 'solutionStep2Title' as const, descKey: 'solutionStep2Desc' as const },
  { num: '03', titleKey: 'solutionStep3Title' as const, descKey: 'solutionStep3Desc' as const },
  { num: '04', titleKey: 'solutionStep4Title' as const, descKey: 'solutionStep4Desc' as const },
]

/**
 * Service 프로세스 4단계 타임라인.
 * 데스크톱: 가로 타임라인(넘버 + 연결선 진행 도트). 모바일: 세로 스택.
 * 기존 pill/라인/넘버 어휘만 사용 — 새 일러스트 없음.
 */
export function ProcessTimeline() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  return (
    <section className="py-16 md:py-24 lg:py-28 px-6 lg:px-24 bg-background">
      <div className="max-w-7xl mx-auto">
        <SectionTag variant="dark">PROCESS</SectionTag>
        <div className="mb-8" />
        <h2 className="heading-kr text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight break-keep max-w-3xl">
          <span>{t('solutionTitle1')}</span>
          <span className="gradient-warm-text">{t('solutionTitle2')}</span>
        </h2>
        <p className="text-lg text-[#A8A29E] mt-4 max-w-2xl break-keep">
          {t('solutionSubtitle')}
        </p>

        {/* Desktop: horizontal timeline */}
        <div className="hidden lg:block mt-16">
          <div className="grid grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {/* connecting line + progress dot */}
                <div className="flex items-center mb-6">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF4500] shrink-0" />
                  {i < STEPS.length - 1 && (
                    <span className="h-px flex-1 bg-gradient-to-r from-[#FF4500]/50 to-[var(--border)]" />
                  )}
                </div>
                <div className="font-display font-bold text-5xl text-[#FF4500] mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 break-keep">
                  {t(step.titleKey)}
                </h3>
                <p className="text-sm text-[#A8A29E] leading-relaxed break-keep">
                  {t(step.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile / tablet: vertical stack */}
        <div className="lg:hidden mt-12 space-y-6">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex gap-5">
              <div className="flex flex-col items-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4500]" />
                {i < STEPS.length - 1 && (
                  <span className="w-px flex-1 bg-gradient-to-b from-[#FF4500]/50 to-[var(--border)] mt-1" />
                )}
              </div>
              <div className="pb-2">
                <div className="font-display font-bold text-3xl text-[#FF4500] leading-none mb-2">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-white mb-1 break-keep">
                  {t(step.titleKey)}
                </h3>
                <p className="text-sm text-[#A8A29E] leading-relaxed break-keep">
                  {t(step.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
