'use client'

import { useRef, useCallback, useEffect, useState } from 'react'

export function GlowSpotlight() {
  const spotlightRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const [visible, setVisible] = useState(false)
  const [isTouch, setIsTouch] = useState(true)

  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (!spotlightRef.current) return
      spotlightRef.current.style.left = `${e.clientX}px`
      spotlightRef.current.style.top = `${e.clientY}px`
    })
    if (!visible) setVisible(true)
  }, [visible])

  const handleMouseLeave = useCallback(() => {
    setVisible(false)
  }, [])

  useEffect(() => {
    if (isTouch) return
    window.addEventListener('mousemove', handleMouseMove)
    document.body.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [isTouch, handleMouseMove, handleMouseLeave])

  if (isTouch) return null

  return (
    <div
      ref={spotlightRef}
      className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
      style={{
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, rgba(255,69,0,0.06) 0%, transparent 70%)',
        opacity: visible ? 1 : 0,
      }}
      aria-hidden="true"
    />
  )
}
