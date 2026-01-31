'use client'

import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

export function FinalCTA() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  return (
    <section className="py-12 sm:py-16 relative overflow-hidden bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-800 border-t border-zinc-700/50 w-full max-w-full">
      <div className="container mx-auto max-w-7xl w-full max-w-full px-4 sm:px-6 lg:px-24 relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center w-full max-w-full min-w-0 block">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-6 text-balance leading-[1.2] tracking-tight break-keep break-words min-h-[2.4em] block">
            <span className="text-white block">{t('finalCtaTitle1')}</span>
            <span className="text-white block">{t('finalCtaTitle2')}</span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-zinc-200 mb-12 text-balance break-keep break-words px-2 max-w-prose mx-auto leading-[1.5] tracking-tight block min-h-[1.5em]">
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
              <div className="text-4xl font-black text-white mb-2">{locale === 'ja' ? '30万' : '30만'}</div>
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
