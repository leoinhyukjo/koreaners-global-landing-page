'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlowButtonProps {
  children: ReactNode
  className?: string
  href?: string
  onClick?: () => void
}

export function GlowButton({ children, className, href, onClick }: GlowButtonProps) {
  const buttonClasses = cn(
    'relative inline-flex items-center justify-center px-8 py-4',
    'text-sm font-bold uppercase tracking-wider text-white',
    'rounded-[var(--radius-sm)]',
    'bg-gradient-to-r from-[#FF4500] to-[#F59E0B]',
    'hover:scale-[1.05] transition-all duration-300',
    'shadow-[0_0_30px_rgba(255,69,0,0.5)]',
    'hover:shadow-[0_0_60px_rgba(255,69,0,0.7)]',
    'animate-pulse-subtle',
    className
  )

  if (href) {
    return (
      <a href={href} className={buttonClasses}>
        {children}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={buttonClasses}>
      {children}
    </button>
  )
}
