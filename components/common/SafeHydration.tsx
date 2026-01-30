'use client'

import { useState, useEffect, type ReactNode } from 'react'

export interface SafeHydrationProps {
  children: ReactNode
  /** 마운트 전에 렌더링할 플레이스홀더. 미지정 시 기본 스켈레톤 사용. */
  fallback?: ReactNode
  /** 플레이스홀더 영역 최소 높이 (레이아웃 유지). 기본값: min-h-screen */
  className?: string
}

const DEFAULT_FALLBACK = (
  <div className="min-h-screen flex items-center justify-center pt-24" aria-hidden="true">
    <div className="h-32 w-full max-w-2xl mx-auto bg-zinc-800/50 rounded animate-pulse" />
  </div>
)

/**
 * 서버와 클라이언트의 초기 렌더를 일치시켜 Hydration Mismatch를 방지합니다.
 * mounted가 true가 될 때까지 fallback만 렌더링하고, 이후에 children을 렌더링합니다.
 * t() 등 로케일 의존 UI는 반드시 이 컴포넌트의 children으로만 렌더링하세요.
 */
export function SafeHydration({ children, fallback, className }: SafeHydrationProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    if (fallback !== undefined) {
      return <>{fallback}</>
    }
    return (
      <div className={className ?? 'min-h-screen'} aria-hidden="true">
        {DEFAULT_FALLBACK}
      </div>
    )
  }

  return <>{children}</>
}
