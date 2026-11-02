import { Image, Shapes } from 'lucide-react'
import type { Mode } from '@/lib/types'
import { cn } from '@/lib/utils'

const TABS: Array<{ mode: Mode; label: string; icon: typeof Shapes }> = [
  { mode: 'icons', label: '图标', icon: Shapes },
  { mode: 'illustrations', label: '插图', icon: Image },
]

/** 顶部模式切换：两个互斥视图，使用 aria-pressed 表达选中态。 */
export function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    onChange(next.mode)
  }

  return (
    <div
      role="group"
      aria-label="内容类型"
      className="inline-flex items-center rounded-full border border-border/70 bg-muted/70 p-0.5"
    >
      {TABS.map((tab, index) => {
        const active = tab.mode === mode
        const Icon = tab.icon
        return (
          <button
            key={tab.mode}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.mode)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              active
                ? 'bg-card font-medium text-foreground shadow-card'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon
              className="size-3.5"
              style={active ? { color: 'hsl(var(--brand))' } : undefined}
              aria-hidden="true"
            />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
