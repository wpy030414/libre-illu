import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  noun: string
  query?: string
  loading?: boolean
  suggestions?: string[]
  onSuggestion?: (term: string) => void
  hasFilters?: boolean
  onClearFilters?: () => void
}

/** 空结果：说明原因、给出可点击的建议词与清除筛选入口。 */
export function EmptyState({
  noun,
  query,
  loading = false,
  suggestions = [],
  onSuggestion,
  hasFilters,
  onClearFilters,
}: EmptyStateProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-brand" />
        <p className="text-sm text-muted-foreground">正在加载{noun}…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <SearchX className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-medium">没有匹配的{noun}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {query ? `“${query}” 暂时没有结果。` : '当前筛选条件下没有内容。'}
          试试更短的关键词，或换一个风格。
        </p>
      </div>
      {suggestions.length > 0 && onSuggestion && (
        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSuggestion(term)}
              className="rounded-full border border-border/80 bg-card px-3 py-1 text-xs text-foreground/75 transition-colors hover:border-brand/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {term}
            </button>
          ))}
        </div>
      )}
      {hasFilters && onClearFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          清除筛选
        </Button>
      )}
    </div>
  )
}
