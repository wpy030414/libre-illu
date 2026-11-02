import { SmartImage } from '@/components/media/smart-image'
import { cn } from '@/lib/utils'

interface ThemeCardProps {
  term: string
  label: string
  images: string[]
  onClick: () => void
  className?: string
}

/** 插图热门主题卡：2×2 图片拼贴，点击直接搜索该主题。 */
export function ThemeCard({ term, label, images, onClick, className }: ThemeCardProps) {
  const cells = Array.from({ length: 4 }, (_, index) =>
    images.length > 0 ? images[index % images.length] : undefined,
  )

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="theme-card"
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card text-left transition-all',
        'hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="grid aspect-[4/3] w-full grid-cols-2 gap-px bg-border/50">
        {cells.map((src, index) =>
          src ? (
            <SmartImage
              key={`${src}-${index}`}
              src={src}
              alt=""
              className="size-full bg-card"
              imgClassName="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div key={index} className="bg-muted" aria-hidden="true" />
          ),
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium">
          {label}
          <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground">
            {term}
          </span>
        </p>
      </div>
    </button>
  )
}
