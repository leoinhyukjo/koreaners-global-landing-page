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
    'hover:scale-[1.05] transition-transform duration-300',
    'shadow-[0_0_20px_rgba(255,69,0,0.3)]',
    'hover:shadow-[0_0_40px_rgba(255,69,0,0.5)]',
    'before:absolute before:inset-[-2px] before:rounded-[calc(var(--radius-sm)+2px)]',
    'before:bg-[conic-gradient(from_var(--border-angle),#FF4500,#F59E0B,#0D9488,#FF4500)]',
    'before:animate-[rotate-border_4s_linear_infinite] before:-z-10',
    'before:opacity-60 before:blur-[2px]',
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
