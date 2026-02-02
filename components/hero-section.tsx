'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
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
    <section className="relative min-h-screen h-full flex items-center justify-center pt-20 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-800 w-full max-w-full overflow-hidden">
      {/* 1. 배경 그리드: 섹션 전체 높이에 끊김 없이 반복 */}
      <div
        className="absolute inset-0 min-h-full z-0 bg-repeat"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
        }}
      />

      {/* 2. 중앙 하이라이트: 부드러운 radial 그라데이션 (경계 완화, 모바일 긴 화면까지 페이드 아웃) */}
      <div
        className="absolute inset-0 min-h-full z-[1] pointer-events-none"
        aria-hidden
        style={{
          background: 'radial-gradient(ellipse 120% 100% at 50% 45%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 40%, transparent 80%)',
        }}
      />

      {/* 3. 텍스트·CTA (배경 위에 고정 배치) — 전역 패딩 2단 구조, min-h로 레이아웃 시프트 방지 */}
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-24 relative z-10 overflow-hidden flex-1 flex flex-col items-center justify-center">
        <div className="container mx-auto max-w-7xl flex-1 flex flex-col items-center justify-center">
        <div className="max-w-5xl mx-auto text-center w-full max-w-full min-w-0">
          {/* BEYOND AGENCY: 아래→위 페이드인, 시차 적용 */}
          <div className="relative pt-20 sm:pt-24 pb-6 sm:pb-8 min-h-[4.5rem] sm:min-h-[5rem] block">
            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0 }}
              className="relative text-5xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black mb-2 text-balance break-keep break-words leading-[1.2] tracking-tight"
            >
              <span className="text-white block">BEYOND</span>
            </motion.h1>
            <motion.h2
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.15 }}
              className="relative text-5xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black mb-8 sm:mb-10 text-balance break-keep break-words leading-[1.2] tracking-tight"
            >
              <span className="text-white block">AGENCY</span>
            </motion.h2>
          </div>

          {/* 브랜드 타이틀: block + min-h로 언어 전환 시 높이 고정 */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
            className="relative pt-12 sm:pt-14 md:py-10 sm:py-12 pb-10 sm:pb-12 min-h-[1.2em] block"
          >
            <h2
              className="relative text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance break-words leading-[1.2] text-white px-1 block"
            >
              {t('heroBrandName')}
            </h2>
          </motion.div>

          {/* CTA 버튼 */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 w-full max-w-full min-h-[4rem] sm:min-h-[3.5rem]"
          >
            <a href="/contact" className="w-full sm:w-auto max-w-full min-w-0">
              <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto font-black break-words min-w-0 max-w-full">
                {t('heroCtaFreeConsult')}
                <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
              </Button>
            </a>
            <a href="/portfolio" className="w-full sm:w-auto max-w-full min-w-0">
              <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto font-black break-words min-w-0 max-w-full">
                {t('heroCtaViewCases')}
              </Button>
            </a>
          </motion.div>
        </div>
        </div>
      </div>
    </section>
  )
}
