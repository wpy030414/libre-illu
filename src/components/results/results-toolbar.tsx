import { SlidersHorizontal } from 'lucide-react'
import { SearchField } from '@/components/search-field'
import { cn } from '@/lib/utils'

interface ResultsToolbarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  onClear: () => void
  placeholder: string
  ariaLabel: string
  onOpenFilters: () => void
  activeFilterCount: number
  busy?: boolean
}

/** 结果页粘性工具栏：搜索框 + 移动端筛选入口。 */
export function ResultsToolbar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
  ariaLabel,
  onOpenFilters,
  activeFilterCount,
  busy,
}: ResultsToolbarProps) {
  return (
    <div className="sticky top-14 z-30 border-b border-border/80 bg-background/90 px-4 py-2.5 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <SearchField
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onClear={onClear}
          placeholder={placeholder}
          ariaLabel={ariaLabel}
          busy={busy}
          className="max-w-2xl flex-1"
        />
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm text-foreground/80 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-label="打开筛选"
          data-testid="filter-trigger"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          筛选
          {activeFilterCount > 0 && (
            <span
              className={cn(
                'grid size-5 place-items-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground',
              )}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
