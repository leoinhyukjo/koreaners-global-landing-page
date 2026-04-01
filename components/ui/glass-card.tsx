'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  variant?: 'dark' | 'light'
  className?: string
  hover?: boolean
}

export function GlassCard({ children, variant = 'dark', className, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] transition-all duration-300',
        variant === 'dark' ? 'glass-dark' : 'glass-light',
        hover && 'hover:-translate-y-3 hover:shadow-2xl hover:shadow-[#FF4500]/25 hover:border-[#FF4500]/30',
        className
      )}
    >
      {children}
    </div>
  )
}
