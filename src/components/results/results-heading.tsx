import { Loader2 } from 'lucide-react'

interface ResultsHeadingProps {
  title: string
  count: number
  /** 计数文案，默认“个结果” */
  noun?: string
  loading?: boolean
  /** 补样本/加载更多时的轻量状态 */
  status?: string
  onStop?: () => void
  hasFilters: boolean
  onClearFilters: () => void
}

/** 结果区标题：查询名 + 结果数（aria-live）+ 筛选清除。 */
export function ResultsHeading({
  title,
  count,
  noun = '个结果',
  loading = false,
  status,
  onStop,
  hasFilters,
  onClearFilters,
}: ResultsHeadingProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <h1 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
      <p
        className="tabular flex items-center gap-1.5 text-xs text-muted-foreground"
        aria-live="polite"
        data-testid="results-count"
      >
        {loading ? (
          <>
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            正在搜索…
          </>
        ) : (
          <>
            {count.toLocaleString()} {noun}
            {status && <span className="text-muted-foreground/80"> · {status}</span>}
          </>
        )}
      </p>
      {status && onStop && (
        <button
          type="button"
          onClick={onStop}
          className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          停止
        </button>
      )}
      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="ml-auto text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          清除筛选
        </button>
      )}
    </div>
  )
}
