'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

const fadeUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.8, ease: 'easeOut' as const },
}

export default function HeroSection() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black px-6 lg:px-24">
      <motion.div
        {...fadeUp}
        className="text-center"
      >
        {/* Tagline */}
        <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-8">
          {t('tagline')}
        </p>

        {/* Decorative accent line */}
        <div className="w-16 h-px bg-[#FF4500] mx-auto mb-8" />

        {/* Main heading */}
        <h1 className="leading-[0.85]">
          <span className="block font-accent text-8xl md:text-9xl lg:text-[12rem] text-white">
            BEYOND
          </span>
          <span className="block font-display font-black text-6xl md:text-7xl lg:text-[8rem] uppercase text-white">
            AGENCY
          </span>
        </h1>

        {/* Subcopy */}
        <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto mt-8">
          {t('heroBrandName')}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link href="/contact" className="bg-[#FF4500] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-[#FF4500]/80 border border-[#FF4500] transition-all duration-300 cursor-pointer text-center">
            {t('heroCtaFreeConsult')}
          </Link>
          <Link href="/portfolio" className="bg-transparent text-white px-8 py-4 text-sm font-bold uppercase tracking-wider border border-white/30 hover:bg-white/10 transition-all duration-300 cursor-pointer text-center">
            {t('heroCtaViewCases')}
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
