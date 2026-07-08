'use client'

import { useEffect, useState } from 'react'

/** 상단 고정 읽기 진행 바 (스크롤 비율만큼 accent 바 확장). */
export function ReadingProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight
      setP(max > 0 ? window.scrollY / max : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent"
      style={{ transform: `scaleX(${p})` }}
    />
  )
}
