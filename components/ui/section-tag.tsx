interface SectionTagProps {
  children: string
  variant?: 'light' | 'dark'
  className?: string
}

export function SectionTag({ children, variant = 'dark', className = '' }: SectionTagProps) {
  const styles = variant === 'dark'
    ? 'text-[#FF4500] bg-white/10'
    : 'text-[#FF4500] bg-[#FF4500]/10'

  return (
    <span className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${styles} ${className}`}>
      {children}
    </span>
  )
}
