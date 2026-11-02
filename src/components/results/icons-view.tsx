import { useEffect, useMemo, useRef, useState } from 'react'
import { FilterPanel, type FilterGroup } from '@/components/results/filter-panel'
import { FilterDrawer } from '@/components/results/filter-drawer'
import { ResultsToolbar } from '@/components/results/results-toolbar'
import { ResultsHeading } from '@/components/results/results-heading'
import { MediaGrid } from '@/components/results/media-grid'
import { EmptyState } from '@/components/results/empty-state'
import { ErrorState } from '@/components/results/error-state'
import { IconTile } from '@/components/icon-tile'
import { IconDetail } from '@/components/icon-detail'
import { useIconResults } from '@/hooks/use-icon-results'
import { useIconSearch } from '@/hooks/use-icon-search'
import { needsDarkBackdrop } from '@/lib/icon-appearance'
import { styleHomeUrl } from '@/lib/style-home'
import { styleRank } from '@/lib/style-order'
import type { AppActions, AppState } from '@/hooks/use-app-state'
import type { CatalogHandle } from '@/lib/use-catalog'
import type { StyleMeta } from '@/lib/styles-catalog'
import type { Icon, IconSet } from '@/lib/types'

interface IconsViewProps {
  state: AppState
  actions: AppActions
  catalogHandle: CatalogHandle
  iconStyles: StyleMeta[]
}

const SUGGESTIONS = ['home', 'arrow', 'user', '日历', '搜索']

/** 图标结果页：筛选面板 + 粘性工具栏 + 宽松网格 + 详情。 */
export function IconsView({ state, actions, catalogHandle, iconStyles }: IconsViewProps) {
  const { state: catalogState, loadMore, busy, reload } = catalogHandle
  const catalog = catalogState.status === 'ready' ? catalogState.catalog : null
  const [draft, setDraft] = useState(state.q)
  const [filterOpen, setFilterOpen] = useState(false)
  const sentinel = useRef<HTMLDivElement | null>(null)
  const primed = useRef('')

  useEffect(() => setDraft(state.q), [state.q])

  // 有关键词时走服务端搜索（总数与 igoutu.cn 对齐）；否则在已拉取的目录样本里浏览
  const searching = Boolean(state.q.trim())
  const search = useIconSearch({
    term: state.q,
    style: state.style,
    category: state.category,
    enabled: searching,
  })
  const local = useIconResults({
    catalog,
    query: state.q,
    style: state.style,
    category: state.category,
    active: !searching && Boolean(state.q || state.style || state.category),
  })

  const results = useMemo(
    () =>
      searching
        ? {
            items: search.items,
            total: search.total,
            hasMore: search.hasMore,
            increase: search.loadMore,
          }
        : local,
    [searching, search.items, search.total, search.hasMore, search.loadMore, local],
  )

  // 进入结果页/切换风格时取首批样本（仅浏览模式需要）
  useEffect(() => {
    if (!catalog || searching) return
    if (primed.current === state.style && catalog.icons.length > 0) return
    primed.current = state.style
    void loadMore({ style: state.style, need: 800 })
  }, [catalog, state.style, loadMore, searching])

  // 触底：先渲染更多结果，再按需补样本
  useEffect(() => {
    const element = sentinel.current
    if (!element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        if (results.hasMore) {
          results.increase()
          return
        }
        // 浏览模式的补样本；搜索模式由服务端分页
        if (!searching && catalog && catalog.icons.length < 2400 && !busy) {
          void loadMore({ style: state.style, need: catalog.icons.length + 600 })
        }
      },
      { rootMargin: '700px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [results, catalog, busy, loadMore, state.style, searching])

  // 风格元数据：目录里没有的风格（多见于搜索结果）用风格清单补上，保证 CDN 路径正确
  const setMap = useMemo(() => {
    const map = new Map<string, IconSet>((catalog?.sets ?? []).map((set) => [set.slug, set]))
    for (const icon of results.items) {
      if (map.has(icon.set)) continue
      const meta = iconStyles.find((style) => style.apiCode === icon.set)
      map.set(icon.set, {
        slug: icon.set,
        name: meta?.title ?? icon.set,
        categories: [],
        cdnPath: icon.set,
      })
    }
    return map
  }, [catalog, iconStyles, results.items])

  const styleGroups = useMemo<FilterGroup[]>(() => {
    const styleOptions = [...iconStyles]
      .sort((a, b) => styleRank(a.title) - styleRank(b.title) || a.title.localeCompare(b.title))
      .map((style) => ({
        value: style.apiCode,
        label: style.title,
        // 每个风格都展示该风格下的 home 图标
        image: styleHomeUrl(style.apiCode, style.previewUrl),
        darkImage: needsDarkBackdrop(style.apiCode),
      }))

    const groups: FilterGroup[] = [
      {
        id: 'style',
        title: '风格',
        options: styleOptions,
        selected: state.style,
        onSelect: (value) => actions.selectStyle(value),
        initialCount: 10,
        searchable: true,
        // 不选或再次点选已选风格即回到全部，无需单独的“全部风格”行
        showAll: false,
      },
    ]

    const set = catalog?.sets.find((item) => item.slug === state.style)
    if (set) {
      const categories = set.categories
        .map((slug) => catalog?.categories.find((category) => category.slug === slug))
        .filter((category): category is NonNullable<typeof category> => Boolean(category))
        .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
        .map((category) => ({
          value: category.slug,
          label: category.name,
        }))
      if (categories.length > 0) {
        groups.push({
          id: 'category',
          title: '分类',
          options: categories,
          selected: state.category,
          onSelect: (value) => actions.selectCategory(value),
          initialCount: 10,
          searchable: categories.length > 24,
          allLabel: '全部分类',
        })
      }
    }
    return groups
  }, [iconStyles, catalog, state.style, state.category, actions])

  const selected = useMemo<Icon | null>(() => {
    if (!state.icon) return null
    const slash = state.icon.indexOf('/')
    if (slash < 0) return null
    const set = state.icon.slice(0, slash)
    const commonName = state.icon.slice(slash + 1)
    const found =
      catalog?.icons.find((icon) => icon.set === set && icon.commonName === commonName) ??
      results.items.find((icon) => icon.set === set && icon.commonName === commonName)
    if (found) return found
    return { id: '', name: commonName, commonName, set, categories: [] }
  }, [state.icon, catalog, results.items])

  const heading = state.q
    ? `“${state.q}” 的图标`
    : state.category
      ? (catalog?.categories.find((category) => category.slug === state.category)?.name ??
        state.category.split('--')[0])
      : state.style
        ? (setMap.get(state.style)?.name ?? state.style)
        : '全部图标'

  const status = search.loadingMore
    ? '正在加载更多…'
    : busy && results.items.length > 0
      ? '正在加载更多…'
      : undefined

  const initialLoading = searching
    ? search.status === 'loading'
    : !catalog || (busy && results.items.length === 0)

  if (catalogState.status === 'error') {
    return (
      <div className="mx-auto w-full max-w-3xl px-4">
        <ErrorState
          title="图标目录加载失败"
          message={catalogState.error}
          onRetry={reload}
          onHome={actions.goHome}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px]">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[248px] shrink-0 overflow-y-auto border-r border-border/80 px-3 py-4 md:block">
        <FilterPanel groups={styleGroups} />
      </aside>

      <section className="min-w-0 flex-1">
        <ResultsToolbar
          value={draft}
          onChange={setDraft}
          onSubmit={(value) => actions.submitSearch(value)}
          onClear={() => actions.goHome()}
          placeholder="搜索图标，如 home / 日历"
          ariaLabel="搜索图标"
          onOpenFilters={() => setFilterOpen(true)}
          activeFilterCount={(state.style ? 1 : 0) + (state.category ? 1 : 0)}
          busy={initialLoading}
        />

        <div className="px-4 py-4 sm:px-6">
          <ResultsHeading
            title={heading}
            count={results.total}
            loading={initialLoading}
            status={status}
            hasFilters={Boolean(state.style || state.category)}
            onClearFilters={actions.clearFilters}
          />

          {initialLoading && results.items.length === 0 ? (
            <MediaGrid kind="icon" loading skeletonCount={30} />
          ) : searching && search.status === 'error' ? (
            <ErrorState
              title="图标搜索失败"
              message={search.error ?? '网络异常'}
              onRetry={search.reload}
              onHome={actions.goHome}
            />
          ) : results.items.length === 0 ? (
            <EmptyState
              noun="图标"
              query={state.q}
              loading={searching ? search.status === 'loading' : busy}
              suggestions={SUGGESTIONS}
              onSuggestion={actions.submitSearch}
              hasFilters={Boolean(state.style || state.category)}
              onClearFilters={actions.clearFilters}
            />
          ) : (
            <MediaGrid kind="icon" sentinelRef={sentinel} busy={busy || search.loadingMore}>
              {results.items.map((icon, index) => (
                <IconTile
                  key={`${icon.set}/${icon.commonName}`}
                  icon={icon}
                  set={setMap.get(icon.set)}
                  eager={index < 12}
                  onSelect={(item) => actions.openIconDetail(`${item.set}/${item.commonName}`)}
                />
              ))}
            </MediaGrid>
          )}

          {results.items.length > 0 && results.items.length < results.total && (
            <p className="py-3 text-center text-xs text-muted-foreground">
              已显示 {results.items.length.toLocaleString()} / {results.total.toLocaleString()}
            </p>
          )}
        </div>
      </section>

      <FilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        groups={styleGroups}
        resultCount={results.total}
      />

      <IconDetail
        icon={selected}
        catalog={catalog}
        items={results.items}
        onSelect={(icon) => actions.openIconDetail(`${icon.set}/${icon.commonName}`)}
        onClose={actions.closeDetail}
      />
    </div>
  )
}
