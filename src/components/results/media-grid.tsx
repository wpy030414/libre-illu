import type { ReactNode, RefObject } from 'react'
import { cn } from '@/lib/utils'

type MediaGridProps = {
  kind: 'icon' | 'illustration'
  children?: ReactNode
  skeletonCount?: number
  loading?: boolean
  sentinelRef?: RefObject<HTMLDivElement | null>
  busy?: boolean
}

/** 图标与插图共用的响应式网格，附带骨架与触底哨兵。 */
export function MediaGrid({
  kind,
  children,
  skeletonCount = 0,
  loading = false,
  sentinelRef,
  busy = false,
}: MediaGridProps) {
  return (
    <div aria-busy={busy}>
      <div
        className={cn(
          'grid',
          kind === 'icon'
            ? 'grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10'
            : 'grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
        )}
      >
        {children}
        {loading &&
          Array.from({ length: skeletonCount }, (_, index) => (
            <SkeletonTile key={`skeleton-${index}`} kind={kind} />
          ))}
      </div>
      {sentinelRef && <div ref={sentinelRef} className="h-10" aria-hidden="true" />}
    </div>
  )
}

function SkeletonTile({ kind }: { kind: 'icon' | 'illustration' }) {
  if (kind === 'icon') {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl p-2">
        <div className="size-12 animate-pulse rounded-lg bg-muted" />
        <div className="h-2.5 w-10 animate-pulse rounded bg-muted" />
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
      <div className="aspect-square w-full animate-pulse bg-muted" />
      <div className="space-y-2 p-2.5">
        <div className="h-2.5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
