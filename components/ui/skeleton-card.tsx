import { Card } from '@/components/ui/card'

export function SkeletonCard() {
  return (
    <Card className="overflow-hidden bg-card border-border rounded-none animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-video bg-white/10" />
      
      {/* Content Skeleton */}
      <div className="p-4 sm:p-6 space-y-3">
        <div className="h-6 bg-white/10 rounded w-3/4" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
        <div className="flex gap-2 pt-4">
          <div className="h-6 bg-white/10 rounded w-16" />
          <div className="h-6 bg-white/10 rounded w-16" />
        </div>
      </div>
    </Card>
  )
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
