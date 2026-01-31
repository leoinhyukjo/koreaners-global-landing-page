'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

/**
 * 로케일은 localStorage 기반으로 클라이언트에서만 결정됩니다.
 * 서버에서는 사용자 언어를 알 수 없으므로, t()를 사용하는 페이지(creator, contact, service)는
 * useMounted 패턴으로 마운트 후에만 번역 텍스트를 렌더링하여 Hydration Mismatch를 방지합니다.
 */
export type Locale = 'ko' | 'ja'

const LOCALE_KEY = 'koreaners-locale'

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ko')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      const stored = localStorage.getItem(LOCALE_KEY) as Locale | null
      if (stored === 'ko' || stored === 'ja') setLocaleState(stored)
    } catch {
      // ignore
    }
  }, [mounted])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'ja' ? 'ja' : 'ko'
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(LOCALE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const value: LocaleContextValue = { locale, setLocale }

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    return { locale: 'ko' as Locale, setLocale: () => {} }
  }
  return ctx
}
