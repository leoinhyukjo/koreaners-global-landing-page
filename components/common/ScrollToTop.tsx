'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Global scroll reset on route change.
 * Fixes mobile bug where portfolio/blog detail pages start at bottom instead of top.
 * Uses instant scroll for iOS/Android compatibility (no animation jump).
 */
export function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Immediate scroll to top on pathname change
    window.scrollTo(0, 0)

    // iOS Safari / Chrome Android: ensure document scroll containers reset
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  return null
}
