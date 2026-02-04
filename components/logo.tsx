'use client'

import { useState } from 'react'
import Image from 'next/image'

const LOGO_SRC = '/images/logo.png'
const FALLBACK_SRC = '/favicon.png'

/**
 * 사이트 로고. 절대 경로 /images/logo.png 사용, 로드 실패 시 /favicon.png로 대체.
 * 헤더용은 priority로 최우선 로드, unoptimized로 최적화 누락 방지.
 */
export function Logo({ variant }: { variant: 'header' | 'footer' }) {
  const [failed, setFailed] = useState(false)
  const isHeader = variant === 'header'

  if (failed) {
    return (
      <img
        src={FALLBACK_SRC}
        alt="KOREANERS"
        className={isHeader ? 'h-7 sm:h-8 w-auto object-contain flex-shrink-0' : 'h-8 w-auto object-contain'}
      />
    )
  }

  return (
    <Image
      src={LOGO_SRC}
      alt="KOREANERS"
      width={isHeader ? 140 : 160}
      height={32}
      className={isHeader ? 'h-7 sm:h-8 w-auto object-contain flex-shrink-0' : 'h-8 w-auto object-contain'}
      priority={isHeader}
      unoptimized
      onError={() => setFailed(true)}
    />
  )
}
