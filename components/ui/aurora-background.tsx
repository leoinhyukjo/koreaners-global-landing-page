'use client'

import { cn } from '@/lib/utils'

interface AuroraBlobConfig {
  color: string
  size: number
  top: string
  left: string
  animation: 'aurora-float' | 'aurora-float-reverse'
  duration: string
}

const defaultBlobs: AuroraBlobConfig[] = [
  { color: 'rgba(255,69,0,0.12)', size: 600, top: '-10%', left: '-10%', animation: 'aurora-float', duration: '18s' },
  { color: 'rgba(245,158,11,0.08)', size: 500, top: '20%', left: '60%', animation: 'aurora-float-reverse', duration: '20s' },
  { color: 'rgba(13,148,136,0.06)', size: 400, top: '60%', left: '30%', animation: 'aurora-float', duration: '22s' },
]

interface AuroraBackgroundProps {
  blobs?: AuroraBlobConfig[]
  className?: string
  withDotPattern?: boolean
}

export function AuroraBackground({ blobs = defaultBlobs, className, withDotPattern = true }: AuroraBackgroundProps) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)} aria-hidden="true">
      {blobs.map((blob, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: blob.size,
            height: blob.size,
            top: blob.top,
            left: blob.left,
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
            filter: 'blur(80px)',
            animation: `${blob.animation} ${blob.duration} ease-in-out infinite`,
          }}
        />
      ))}
      {withDotPattern && (
        <div className="absolute inset-0 dot-pattern" />
      )}
    </div>
  )
}
