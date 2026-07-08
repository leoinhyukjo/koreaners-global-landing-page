'use client'

import { Instagram, Youtube, Music } from 'lucide-react'
import { CountUp } from '@/components/ui/count-up'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'

/**
 * 크리에이터 카드 그리드(동의 전 숨김) 자리를 채우는 익명 통계 그리드.
 * 실명/사진/핸들 없이 네트워크 규모·플랫폼·성별연령 분포만 시각화.
 * 새 수치 도입 금지 — 검증값 220명+ 만 노출, 나머지는 기존 페이지 텍스트 재사용.
 */
export function NetworkStats() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const countSuffix = locale === 'ja' ? '名+' : '명+'

  const platforms = [
    { icon: Instagram, name: 'Instagram' },
    { icon: Music, name: 'TikTok' },
    { icon: Youtube, name: 'YouTube' },
  ]

  const demographics = [
    t('creatorDemographicLabel10s'),
    t('creatorDemographicLabel20s'),
    t('creatorDemographicLabel30s'),
    t('creatorDemographicLabelMale'),
  ]

  return (
    <div className="mb-20 sm:mb-28">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
        {/* Headline stat */}
        <div className="bg-surface-1 rounded-[var(--radius)] border border-[var(--border)] p-8 flex flex-col justify-center">
          <div className="text-xs uppercase tracking-[0.2em] text-[#FF4500] font-bold mb-4">
            {t('creatorNetworkTag')}
          </div>
          <div className="font-display font-bold text-6xl gradient-warm-text leading-none">
            <CountUp value={220} suffix={countSuffix} />
          </div>
          <p className="text-sm text-[#A8A29E] mt-3 break-keep">
            {t('creatorNetworkLabel')}
          </p>
        </div>

        {/* Platform distribution */}
        <div className="bg-surface-1 rounded-[var(--radius)] border border-[var(--border)] p-8">
          <h3 className="text-lg font-bold text-white mb-5 break-keep">
            {t('creatorPlatformExpertise')}
          </h3>
          <ul className="space-y-3">
            {platforms.map((p) => (
              <li key={p.name} className="flex items-center gap-3">
                <span className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] bg-surface-2 border border-[var(--border)] shrink-0">
                  <p.icon className="w-4 h-4 text-[#FF4500]/80" />
                </span>
                <span className="text-sm font-medium text-white/90">{p.name}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#A8A29E] mt-5 leading-relaxed break-keep">
            {t('creatorNetworkPlatformNote')}
          </p>
        </div>

        {/* Demographic distribution */}
        <div className="bg-surface-1 rounded-[var(--radius)] border border-[var(--border)] p-8">
          <h3 className="text-lg font-bold text-white mb-5 break-keep">
            {t('creatorDemographicTitle')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {demographics.map((label) => (
              <span
                key={label}
                className="px-3 py-1.5 rounded-full bg-surface-2 border border-[#FF4500]/20 text-[#FF4500] text-xs font-semibold break-keep"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
