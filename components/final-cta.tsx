'use client'

import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

export function FinalCTA() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  return (
    <section className="py-12 sm:py-16 relative overflow-hidden bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-800 border-t border-zinc-700/50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 text-balance leading-tight break-keep">
            <span className="text-white inline-block">{t('finalCtaTitle1')}</span>{' '}
            <span className="text-white inline-block">{t('finalCtaTitle2')}</span>
          </h2>
          
          <p className="text-lg sm:text-xl text-zinc-200 mb-12 text-balance break-keep px-2 max-w-prose mx-auto">
            {t('finalCtaSubtitle')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pt-8 border-t border-zinc-700/50">
            <div>
              <div className="text-4xl font-black text-white mb-2">300+</div>
              <div className="text-sm text-zinc-200">{t('finalCtaStat1')}</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">105</div>
              <div className="text-sm text-zinc-200">{t('finalCtaStat2')}</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">30만</div>
              <div className="text-sm text-zinc-200">{t('finalCtaStat3')}</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">250%</div>
              <div className="text-sm text-zinc-200">{t('finalCtaStat4')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
