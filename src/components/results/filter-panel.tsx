import { useMemo, useState } from 'react'
import { ChevronDown, LayoutGrid, Search } from 'lucide-react'
import { SmartImage } from '@/components/media/smart-image'
import { cn } from '@/lib/utils'

export interface FilterOption {
  value: string
  label: string
  count?: number
  /** 风格卡缩略图 */
  image?: string
  /** 缩略图需要深色底板（浅色半透明风格） */
  darkImage?: boolean
}

export interface FilterGroup {
  id: string
  title: string
  options: FilterOption[]
  selected: string
  onSelect: (value: string) => void
  /** 列表超过该数量时提供“展开全部” */
  initialCount?: number
  /** 选项很多时显示组内搜索 */
  searchable?: boolean
  /** “全部”行的标签 */
  allLabel?: string
  /** 是否显示“全部”行，默认显示 */
  showAll?: boolean
  /** 选中项再次点击是否清除 */
  allowClear?: boolean
}

interface FilterPanelProps {
  groups: FilterGroup[]
  className?: string
}

/** 桌面筛选面板与移动端抽屉共用的内容组件。 */
export function FilterPanel({ groups, className }: FilterPanelProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {groups.map((group) => (
        <FilterSection key={group.id} group={group} />
      ))}
    </div>
  )
}

function FilterSection({ group }: { group: FilterGroup }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const limit = group.initialCount ?? 10
  const searchable = group.searchable ?? group.options.length > 24

  const options = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return group.options
    return group.options.filter((option) => option.label.toLowerCase().includes(text))
  }, [group.options, query])

  const visible = expanded || query ? options : options.slice(0, limit)
  const canExpand = !query && options.length > limit

  return (
    <section aria-labelledby={`filter-${group.id}`}>
      <div className="flex items-center justify-between px-1">
        <h3
          id={`filter-${group.id}`}
          className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
        >
          {group.title}
        </h3>
        <span className="tabular text-[11px] text-muted-foreground/70">{options.length}</span>
      </div>

      {searchable && (
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`搜索${group.title}`}
            aria-label={`搜索${group.title}`}
            className="h-8 w-full rounded-lg border border-border/80 bg-card pl-8 pr-2 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      <div className="mt-1.5 space-y-0.5">
        {group.showAll !== false && (
          <FilterRow
            active={!group.selected}
            label={group.allLabel ?? `全部${group.title}`}
            onClick={() => group.onSelect('')}
            icon
          />
        )}
        {visible.map((option) => (
          <FilterRow
            key={option.value}
            active={group.selected === option.value}
            label={option.label}
            count={option.count}
            image={option.image}
            darkImage={option.darkImage}
            onClick={() =>
              group.onSelect(
                group.selected === option.value && group.allowClear !== false ? '' : option.value,
              )
            }
          />
        ))}
      </div>

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1.5 flex items-center gap-1 rounded-md px-1 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown className={cn('size-3 transition-transform', expanded && 'rotate-180')} />
          {expanded ? '收起' : `展开全部 ${options.length} 项`}
        </button>
      )}
    </section>
  )
}

function FilterRow({
  active,
  label,
  count,
  image,
  darkImage,
  onClick,
  icon,
}: {
  active: boolean
  label: string
  count?: number
  image?: string
  darkImage?: boolean
  onClick: () => void
  icon?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-brand-soft font-medium text-foreground'
          : 'text-foreground/75 hover:bg-accent hover:text-foreground',
      )}
    >
      {icon && (
        <LayoutGrid className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      {image && (
        <div
          className={cn(
            'size-6 shrink-0',
            darkImage && 'rounded border border-border/60 bg-neutral-900',
          )}
        >
          <SmartImage
            src={image}
            alt=""
            className={cn('size-full', !darkImage && 'rounded border border-border/60 bg-card')}
            imgClassName="object-cover"
          />
        </div>
      )}
      <span className="truncate">{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="tabular ml-auto pl-2 text-[11px] font-normal text-muted-foreground">
          {count.toLocaleString()}
        </span>
      )}
    </button>
  )
}
