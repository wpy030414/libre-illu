import { useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { FilterPanel, type FilterGroup } from '@/components/results/filter-panel'
import { FilterDrawer } from '@/components/results/filter-drawer'
import { ResultsToolbar } from '@/components/results/results-toolbar'
import { ResultsHeading } from '@/components/results/results-heading'
import { MediaGrid } from '@/components/results/media-grid'
import { EmptyState } from '@/components/results/empty-state'
import { ErrorState } from '@/components/results/error-state'
import { IllustrationTile } from '@/components/illustration-tile'
import { IllustrationDetail } from '@/components/illustration-detail'
import { useIllustrationResults } from '@/hooks/use-illustration-results'
import type { AppActions, AppState } from '@/hooks/use-app-state'
import type { IllustrationStyle } from '@/lib/illustration-styles'
import type { Illustration } from '@/lib/types'

interface IllustrationsViewProps {
  state: AppState
  actions: AppActions
  illustrationStyles: IllustrationStyle[]
}

const SUGGESTIONS = ['cat', 'home', 'office', 'team', 'business', 'education']
const CHINESE = /[㐀-鿿]/

/** 插图结果页：搜索 + 风格筛选 + 自动分页网格 + 详情。 */
export function IllustrationsView({ state, actions, illustrationStyles }: IllustrationsViewProps) {
  const [draft, setDraft] = useState(state.q)
  const [filterOpen, setFilterOpen] = useState(false)
  const sentinel = useRef<HTMLDivElement | null>(null)
  const chinese = CHINESE.test(state.q)
  const enabled = Boolean(state.q.trim()) && !chinese

  useEffect(() => setDraft(state.q), [state.q])

  const results = useIllustrationResults({
    search: state.q,
    stylePrettyId: state.style,
    enabled,
  })

  // 触底自动取下一页（接口每页 10 条）
  useEffect(() => {
    const element = sentinel.current
    if (!element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) results.loadMore()
      },
      { rootMargin: '600px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [results])

  const groups = useMemo<FilterGroup[]>(() => {
    const map = new Map<string, { label: string; count: number }>()
    for (const item of results.items) {
      for (const style of item.styles) {
        const prev = map.get(style.slug)
        map.set(style.slug, { label: style.title, count: (prev?.count ?? 0) + 1 })
      }
    }
    if (state.style) {
      const known = illustrationStyles.find((style) => style.slug === state.style)
      if (known && !map.has(known.slug)) map.set(known.slug, { label: known.title, count: 0 })
    }
    const options = [...map.entries()]
      .map(([value, entry]) => ({ value, label: entry.label, count: entry.count }))
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))

    return [
      {
        id: 'style',
        title: '风格',
        options,
        selected: state.style,
        onSelect: (value) => actions.selectStyle(value),
        initialCount: 10,
        // 不选风格即全部，无需单独的“全部风格”行
        showAll: false,
      },
    ]
  }, [results.items, illustrationStyles, state.style, actions])

  const selected = useMemo<Illustration | null>(
    () => (state.ill ? (results.items.find((item) => item.prettyId === state.ill) ?? null) : null),
    [state.ill, results.items],
  )

  const heading = state.q ? `“${state.q}” 的插图` : '插图'
  const status = results.loadingMore ? '正在加载更多…' : undefined

  if (chinese) {
    return (
      <div>
        <ResultsToolbar
          value={draft}
          onChange={setDraft}
          onSubmit={(value) => actions.submitSearch(value)}
          onClear={() => actions.goHome()}
          placeholder="搜索插图，如 cat / office"
          ariaLabel="搜索插图"
          onOpenFilters={() => setFilterOpen(true)}
          activeFilterCount={state.style ? 1 : 0}
        />
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Info className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-medium">插图搜索目前只支持英文关键词</p>
          <p className="mt-1 text-xs text-muted-foreground">
            “{state.q}” 是中文，试试下面的英文关键词。
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => actions.submitSearch(term)}
                className="rounded-full border border-border/80 bg-card px-3 py-1 text-xs text-foreground/75 transition-colors hover:border-brand/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
        <FilterDrawer
          open={filterOpen}
          onOpenChange={setFilterOpen}
          groups={groups}
          resultCount={results.total}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px]">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[248px] shrink-0 overflow-y-auto border-r border-border/80 px-3 py-4 md:block">
        <FilterPanel groups={groups} />
      </aside>

      <section className="min-w-0 flex-1">
        <ResultsToolbar
          value={draft}
          onChange={setDraft}
          onSubmit={(value) => actions.submitSearch(value)}
          onClear={() => actions.goHome()}
          placeholder="搜索插图，如 cat / office"
          ariaLabel="搜索插图"
          onOpenFilters={() => setFilterOpen(true)}
          activeFilterCount={state.style ? 1 : 0}
          busy={results.status === 'loading'}
        />

        <div className="px-4 py-4 sm:px-6">
          <ResultsHeading
            title={heading}
            count={results.total}
            noun="个结果"
            loading={results.status === 'loading'}
            status={status}
            hasFilters={Boolean(state.style)}
            onClearFilters={actions.clearFilters}
          />

          {results.status === 'error' ? (
            <ErrorState
              title="插图搜索失败"
              message={`${results.error ?? '请求失败'} · 插图接口仅支持英文关键词`}
              onRetry={results.reload}
              onHome={actions.goHome}
            />
          ) : results.status === 'loading' && results.items.length === 0 ? (
            <MediaGrid kind="illustration" loading skeletonCount={12} />
          ) : results.items.length === 0 ? (
            <EmptyState
              noun="插图"
              query={state.q}
              suggestions={SUGGESTIONS}
              onSuggestion={actions.submitSearch}
              hasFilters={Boolean(state.style)}
              onClearFilters={actions.clearFilters}
            />
          ) : (
            <MediaGrid kind="illustration" sentinelRef={sentinel} busy={results.loadingMore}>
              {results.items.map((item, index) => (
                <IllustrationTile
                  key={item.id}
                  item={item}
                  eager={index < 6}
                  onSelect={(selectedItem) => actions.openIllustrationDetail(selectedItem.prettyId)}
                />
              ))}
            </MediaGrid>
          )}

          {results.items.length > 0 && results.items.length < results.total && (
            <p className="py-3 text-center text-xs text-muted-foreground">
              已显示 {results.items.length} / {results.total.toLocaleString()}
            </p>
          )}
        </div>
      </section>

      <FilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        groups={groups}
        resultCount={results.total}
      />

      <IllustrationDetail
        item={selected}
        items={results.items}
        onSelect={(item) => actions.openIllustrationDetail(item.prettyId)}
        onClose={actions.closeDetail}
        onSearch={actions.submitSearch}
      />
    </div>
  )
}
