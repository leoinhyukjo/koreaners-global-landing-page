'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

export function ClientShowcase() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const [clients, setClients] = useState<string[]>([])

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('client_name')
        .order('created_at', { ascending: false })

      if (error) throw error

      // 중복 제거 + 빈 값 필터
      const unique = [...new Set(
        (data || [])
          .map(d => d.client_name?.trim())
          .filter(Boolean)
      )] as string[]

      setClients(unique)
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    }
  }

  if (clients.length === 0) return null

  // 마키용 복제 (최소 2세트)
  const marqueeItems = [...clients, ...clients]

  return (
    <section className="bg-[#141414] py-16 md:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-24 mb-10">
        <span className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">
          TRUSTED BY {clients.length}+ BRANDS
        </span>
      </div>

      {/* Card marquee */}
      <div className="flex whitespace-nowrap [animation:marquee-left_30s_linear_infinite] hover:[animation-play-state:paused]">
        {marqueeItems.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="shrink-0 mx-3 bg-[#111] border border-white/10 px-8 py-5 hover:border-[#FF4500]/40 transition-colors duration-300"
          >
            <span className="font-display font-bold text-lg text-white uppercase tracking-wider whitespace-nowrap">
              {name}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
