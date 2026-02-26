'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function MetaPixelPageView() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
      return
    }
    // afterInteractive 스크립트보다 useEffect가 먼저 실행될 수 있음
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'PageView')
        clearInterval(interval)
      } else if (attempts > 50) {
        clearInterval(interval)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [pathname])

  return null
}
