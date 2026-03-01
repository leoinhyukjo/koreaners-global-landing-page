'use client'

import { Database, Shield, Target, AlertTriangle } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

const BARRIER_DESC_KEYS = ['barrier1Desc', 'barrier2Desc', 'barrier3Desc', 'barrier4Desc'] as const

export function Barriers() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const barriers = [
    { icon: Database, title: 'Data Black-box', descKey: BARRIER_DESC_KEYS[0] },
    { icon: Shield, title: 'Trust Barrier', descKey: BARRIER_DESC_KEYS[1] },
    { icon: Target, title: 'Lack of Strategy', descKey: BARRIER_DESC_KEYS[2] },
    { icon: AlertTriangle, title: 'Operational Risk', descKey: BARRIER_DESC_KEYS[3] },
  ]

  return (
    <section className="bg-[#141414] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <span className="text-xs uppercase tracking-[0.2em] text-white/40">BARRIERS</span>
        <div className="w-12 h-0.5 bg-[#FF4500] mt-3 mb-6" />
        <h2 className="font-display font-black text-4xl lg:text-6xl uppercase leading-[0.9] text-white max-w-2xl">
          {t('barriersTitle1')}
          {t('barriersTitle2')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16">
          {barriers.map((barrier, index) => (
            <div
              key={index}
              className="bg-[#111] border border-white/10 p-8 hover:border-[#FF4500]/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <barrier.icon className="w-10 h-10 text-[#FF4500]/70 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{barrier.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{t(barrier.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
