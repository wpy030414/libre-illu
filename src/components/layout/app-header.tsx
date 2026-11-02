import { Github } from 'lucide-react'
import { ModeTabs } from '@/components/mode-tabs'
import type { Mode } from '@/lib/types'

interface AppHeaderProps {
  mode: Mode
  onMode: (mode: Mode) => void
  onHome: () => void
}

/** 全站顶栏：品牌、模式切换与轻量外部入口。 */
export function AppHeader({ mode, onMode, onHome }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="rounded-lg pr-1 text-base font-semibold tracking-tight transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="回到首页"
        >
          LibreIllu
        </button>

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />

        <ModeTabs mode={mode} onChange={onMode} />

        <a
          href="https://github.com/wpy030414/libre-illu"
          target="_blank"
          rel="noreferrer"
          className="ml-auto rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="在 GitHub 上查看源码"
        >
          <Github className="size-4" />
        </a>
      </div>
    </header>
  )
}
