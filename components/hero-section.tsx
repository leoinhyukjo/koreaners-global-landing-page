'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { SectionTag } from '@/components/ui/section-tag'
import { KineticText } from '@/components/ui/kinetic-text'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { GlowButton } from '@/components/ui/glow-button'
import { ChevronDown } from 'lucide-react'

export default function HeroSection() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[var(--kn-dark)] px-6 lg:px-24 overflow-hidden">
      {/* Aurora mesh gradient background */}
      <AuroraBackground
        blobs={[
          { color: 'rgba(255,69,0,0.15)', size: 800, top: '-20%', left: '-10%', animation: 'aurora-float', duration: '18s' },
          { color: 'rgba(245,158,11,0.1)', size: 600, top: '10%', left: '60%', animation: 'aurora-float-reverse', duration: '20s' },
          { color: 'rgba(13,148,136,0.07)', size: 500, top: '50%', left: '20%', animation: 'aurora-float', duration: '22s' },
          { color: 'rgba(255,69,0,0.08)', size: 400, top: '60%', left: '70%', animation: 'aurora-float-reverse', duration: '16s' },
        ]}
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Section tag */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SectionTag variant="dark">{t('tagline')}</SectionTag>
        </motion.div>

        {/* Main heading — kinetic typography */}
        <div className="mt-8 leading-[0.85]">
          <KineticText
            text="BEYOND"
            as="span"
            className="block font-display font-bold italic text-8xl md:text-9xl lg:text-[12rem] uppercase gradient-warm-text"
            staggerDelay={0.04}
          />
          <motion.span
            className="block font-display font-bold text-6xl md:text-7xl lg:text-[8rem] uppercase text-[var(--foreground)]"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }}
          >
            AGENCY
          </motion.span>
        </div>

        {/* Subcopy */}
        <motion.p
          className="text-lg md:text-xl text-[#A8A29E] max-w-xl mx-auto mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          {t('heroBrandName')}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <GlowButton href="/contact">
            {t('heroCtaFreeConsult')}
          </GlowButton>
          <Link
            href="/portfolio"
            className="glass-dark px-8 py-4 text-sm font-bold uppercase tracking-wider text-[var(--foreground)] rounded-[var(--radius-sm)] hover:border-[#FF4500]/60 transition-all duration-300 cursor-pointer text-center"
          >
            {t('heroCtaViewCases')}
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.div>
    </section>
  )
}
