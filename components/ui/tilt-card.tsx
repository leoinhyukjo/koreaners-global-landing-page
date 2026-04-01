'use client'

import { useRef, useCallback, useState, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  glowColor?: string
}

export function TiltCard({ children, className, maxTilt = 8, glowColor = 'rgba(255,69,0,0.15)' }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const [isTouch, setIsTouch] = useState(true)

  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      cardRef.current.style.transform = `perspective(1000px) rotateY(${x * maxTilt}deg) rotateX(${-y * maxTilt}deg) scale(1.02)`
      cardRef.current.style.boxShadow = `0 20px 60px ${glowColor}`
    })
  }, [maxTilt, glowColor])

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)'
    cardRef.current.style.boxShadow = 'none'
  }, [])

  return (
    <div
      ref={cardRef}
      className={cn('will-change-transform', className)}
      onMouseMove={isTouch ? undefined : handleMouseMove}
      onMouseLeave={isTouch ? undefined : handleMouseLeave}
      style={{ transition: 'transform 0.15s ease-out, box-shadow 0.3s ease-out' }}
    >
      {children}
    </div>
  )
}
