import { cn } from '@/lib/utils'

interface DotPatternProps {
  className?: string
}

export function DotPattern({ className }: DotPatternProps) {
  return (
    <div
      className={cn('absolute inset-0 dot-pattern pointer-events-none', className)}
      aria-hidden="true"
    />
  )
}
