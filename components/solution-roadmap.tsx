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
        <span className="text-xs uppercase tracking-[0.2em] text-black/40">OUR PROCESS</span>
        <h2 className="font-display font-black text-4xl lg:text-6xl uppercase mt-4 leading-[0.9] text-[#09090B]">
          {t('solutionTitle1')}
          {t('solutionTitle2')}
        </h2>

        <div className="mt-16">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6 md:gap-8 mb-12 last:mb-0">
              {/* Left: line + node */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-display font-bold text-sm">
                  {String(i + 1).padStart(2, '0')}
                </div>
                {i < steps.length - 1 && <div className="w-px bg-black/20 flex-1 mt-2" />}
              </div>
              {/* Right: content */}
              <div className="pt-2 pb-8">
                <span className="inline-block bg-black text-white text-xs uppercase tracking-wider px-3 py-1 mb-3">
                  {step.tag}
                </span>
                <h3 className="text-xl font-bold text-[#09090B] mb-2">{t(step.titleKey)}</h3>
                <p className="text-black/60 leading-relaxed mb-4">{t(step.descKey)}</p>
                <ul className="space-y-2">
                  {step.featureKeys.map((f, j) => (
                    <li key={j} className="text-sm text-black/50 flex items-center gap-2">
                      <span className="w-1 h-1 bg-black/40 rounded-full shrink-0" />
                      {t(f)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
