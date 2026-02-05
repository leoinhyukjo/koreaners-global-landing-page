'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

export function MarketingCTA() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  return (
    <section
      className="mt-12 sm:mt-16 py-10 sm:py-14 px-4 sm:px-6 lg:px-24 rounded-none border border-zinc-700/50 bg-gradient-to-b from-zinc-800/90 to-zinc-900"
      aria-label={t('marketingCtaButton')}
    >
      <div className="container mx-auto max-w-7xl">
        <div className="max-w-2xl mx-auto text-center space-y-5 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight break-keep">
          {t('marketingCtaTitle')}
        </h2>
        <div className="text-sm sm:text-base text-zinc-300 leading-relaxed break-keep space-y-3">
          <p className="font-semibold text-white">
            {t('marketingCtaP1')}
          </p>
          <p>
            {t('marketingCtaP2')}
          </p>
        </div>
        <div className="pt-2">
          <Link href="/contact">
            <Button
              size="default"
              className="px-6 py-2.5 font-black rounded-none transition-colors duration-300"
            >
              {t('marketingCtaButton')}
            </Button>
          </Link>
        </div>
      </div>
      </div>
    </section>
  )
}
