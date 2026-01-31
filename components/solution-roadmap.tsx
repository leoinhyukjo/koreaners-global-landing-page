'use client'

import { Card } from '@/components/ui/card'
import { Activity, Sprout, Zap, Settings } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

const STEP_KEYS = [
  { number: '01', icon: Activity, tag: 'Diagnostic', titleKey: 'solutionStep1Title' as const, descKey: 'solutionStep1Desc' as const, featureKeys: ['solutionStep1F1', 'solutionStep1F2', 'solutionStep1F3'] as const },
  { number: '02', icon: Sprout, tag: 'Seeding', titleKey: 'solutionStep2Title' as const, descKey: 'solutionStep2Desc' as const, featureKeys: ['solutionStep2F1', 'solutionStep2F2', 'solutionStep2F3'] as const },
  { number: '03', icon: Zap, tag: 'Impact', titleKey: 'solutionStep3Title' as const, descKey: 'solutionStep3Desc' as const, featureKeys: ['solutionStep3F1', 'solutionStep3F2', 'solutionStep3F3'] as const },
  { number: '04', icon: Settings, tag: 'Management', titleKey: 'solutionStep4Title' as const, descKey: 'solutionStep4Desc' as const, featureKeys: ['solutionStep4F1', 'solutionStep4F2', 'solutionStep4F3'] as const },
]

export function SolutionRoadmap() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const steps = STEP_KEYS

  return (
    <section id="solution" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-24 relative bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-800 border-t border-zinc-700/50 w-full max-w-full overflow-hidden">
      <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 block">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 text-balance break-keep break-words leading-[1.2] tracking-tight min-h-[2.4em] block">
              <span className="text-white block">{t('solutionTitle1')}</span>
              <span className="text-white block">{t('solutionTitle2')}</span>
            </h2>
            <p className="text-lg text-zinc-200 break-keep max-w-prose mx-auto leading-[1.5] tracking-tight block min-h-[1.5em]">
              {t('solutionSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="relative p-6 bg-zinc-800 border-zinc-700/50 hover:border-white hover:-translate-y-1 transition-all duration-200 group overflow-hidden rounded-none"
              >
                <div className="absolute top-4 right-4 text-7xl font-black text-zinc-800 group-hover:text-zinc-700 transition-all duration-200">
                  {step.number}
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-200 rounded-none">
                      <step.icon className="w-6 h-6 text-white group-hover:text-black transition-colors duration-200" />
                    </div>
                    <div className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-none">
                      {step.tag}
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-white mb-2 break-keep leading-[1.2] tracking-tight block">
                    {t(step.titleKey)}
                  </h3>

                  <p className="text-white font-bold mb-4 break-keep text-sm leading-[1.5] tracking-tight block">
                    {t(step.descKey)}
                  </p>

                  <ul className="space-y-1.5">
                    {step.featureKeys.map((key, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-zinc-200 break-keep text-sm">
                        <div className="w-1 h-1 bg-white" />
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
      </div>
    </section>
  )
}
