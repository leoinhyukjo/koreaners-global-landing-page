'use client'

import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

const STEP_KEYS = [
  { tag: 'Diagnostic', titleKey: 'solutionStep1Title' as const, descKey: 'solutionStep1Desc' as const, featureKeys: ['solutionStep1F1', 'solutionStep1F2', 'solutionStep1F3'] as const },
  { tag: 'Seeding', titleKey: 'solutionStep2Title' as const, descKey: 'solutionStep2Desc' as const, featureKeys: ['solutionStep2F1', 'solutionStep2F2', 'solutionStep2F3'] as const },
  { tag: 'Impact', titleKey: 'solutionStep3Title' as const, descKey: 'solutionStep3Desc' as const, featureKeys: ['solutionStep3F1', 'solutionStep3F2', 'solutionStep3F3'] as const },
  { tag: 'Management', titleKey: 'solutionStep4Title' as const, descKey: 'solutionStep4Desc' as const, featureKeys: ['solutionStep4F1', 'solutionStep4F2', 'solutionStep4F3'] as const },
]

export function SolutionRoadmap() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const steps = STEP_KEYS

  return (
    <section id="solution" className="bg-white py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Section tag */}
        <div className="flex items-center gap-4 mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-black/40 font-bold">OUR PROCESS</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        {/* Steps */}
        <div className="space-y-24 md:space-y-32">
          {steps.map((step, i) => (
            <div key={i}>
              {/* Number + Tag */}
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <span className="font-display font-bold text-xl md:text-2xl text-[#FF4500]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-black/40 font-bold">
                  {step.tag}
                </span>
              </div>

              {/* MASSIVE title — Forma style, font-bold not font-black */}
              <h3 className="font-display font-bold text-5xl md:text-7xl lg:text-[6rem] xl:text-[8rem] uppercase leading-[0.85] tracking-tight text-[#141414]">
                {t(step.titleKey)}
              </h3>

              {/* Description + Features row */}
              <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-start">
                <p className="text-base md:text-lg text-black/60 leading-relaxed max-w-xl">
                  {t(step.descKey)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {step.featureKeys.map((f, j) => (
                    <span key={j} className="text-xs text-black/50 border border-black/10 px-3 py-1.5 uppercase tracking-wider">
                      {t(f)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Divider */}
              {i < steps.length - 1 && (
                <div className="h-px bg-black/10 mt-24 md:mt-32" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
