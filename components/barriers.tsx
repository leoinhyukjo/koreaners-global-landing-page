'use client'

import { Card } from '@/components/ui/card'
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
    <section className="py-12 sm:py-16 relative bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 border-t border-zinc-700/50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-balance break-keep">
              <span className="text-white">{t('barriersTitle1')}</span>
              <span className="text-white">{t('barriersTitle2')}</span>
            </h2>
            <p className="text-lg text-zinc-200 break-keep max-w-prose mx-auto">
              {t('barriersSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {barriers.map((barrier, index) => (
              <Card
                key={index}
                className="p-6 bg-zinc-800 border-zinc-700/50 hover:border-white hover:-translate-y-1 transition-all duration-200 group rounded-none"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-200 rounded-none">
                      <barrier.icon className="w-7 h-7 text-white group-hover:text-black transition-colors duration-200" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-2 break-keep">
                      {barrier.title}
                    </h3>
                    <p className="text-zinc-200 leading-relaxed break-keep text-sm">
                      {t(barrier.descKey)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
      </div>
    </section>
  )
}
