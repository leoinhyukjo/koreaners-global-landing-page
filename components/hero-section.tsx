'use client'

import Link from 'next/link'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { SectionTag } from '@/components/ui/section-tag'

export default function HeroSection() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[var(--kn-dark)] px-6 lg:px-24 hero-glow">
      <div className="text-center">
        <SectionTag variant="dark">{t('tagline')}</SectionTag>

        <h1 className="leading-[0.85] mt-8">
          <span className="block font-display font-bold italic text-8xl md:text-9xl lg:text-[12rem] uppercase gradient-warm-text">
            BEYOND
          </span>
          <span className="block font-display font-bold text-6xl md:text-7xl lg:text-[8rem] uppercase text-[var(--foreground)]">
            AGENCY
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[#A8A29E] max-w-xl mx-auto mt-8">
          {t('heroBrandName')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link href="/contact" className="gradient-warm text-white px-8 py-4 text-sm font-bold uppercase tracking-wider rounded-[var(--radius-sm)] hover:opacity-90 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF4500]/20 cursor-pointer text-center">
            {t('heroCtaFreeConsult')}
          </Link>
          <Link href="/portfolio" className="bg-transparent text-[var(--foreground)] px-8 py-4 text-sm font-bold uppercase tracking-wider border border-[#A8A29E]/30 rounded-[var(--radius-sm)] hover:border-[#FF4500]/60 hover:bg-white/5 transition-all duration-300 cursor-pointer text-center">
            {t('heroCtaViewCases')}
          </Link>
        </div>
      </div>
    </section>
  )
}
