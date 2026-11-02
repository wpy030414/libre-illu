import { ArrowUpRight } from 'lucide-react'
import { SmartImage } from '@/components/media/smart-image'
import { cn } from '@/lib/utils'

interface StyleCardProps {
  title: string
  count?: number
  image?: string
  background?: string
  onClick: () => void
  className?: string
}

/** 官方风格卡：预览图 + 名称 + 数量，用于首页风格墙。 */
export function StyleCard({ title, count, image, background, onClick, className }: StyleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="style-card"
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card text-left transition-all',
        'hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      <div
        className="relative aspect-[4/3] w-full overflow-hidden bg-muted"
        style={background ? { backgroundColor: background } : undefined}
      >
        {image ? (
          <SmartImage
            src={image}
            alt={`${title} 风格预览`}
            className="size-full"
            imgClassName="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid size-full place-items-center text-lg font-semibold text-muted-foreground">
            {title.slice(0, 2)}
          </div>
        )}
      </div>
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-5">{title}</p>
          {typeof count === 'number' && count > 0 && (
            <p className="tabular text-xs text-muted-foreground">{count.toLocaleString()} 个</p>
          )}
        </div>
        <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-brand" />
      </div>
    </button>
  )
}
