'use client'

import { useState, useEffect } from 'react'

/**
 * Returns true only after the component has mounted on the client.
 * Use to avoid hydration mismatch when rendering locale-dependent or client-only content.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}
