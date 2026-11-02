import { useEffect } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { LandingView } from '@/components/home/landing-view'
import { IconsView } from '@/components/results/icons-view'
import { IllustrationsView } from '@/components/results/illustrations-view'
import { useAppState } from '@/hooks/use-app-state'
import { useIconStyles } from '@/hooks/use-icon-styles'
import { useIllustrationStyles } from '@/hooks/use-illustration-styles'
import { useCatalog } from '@/lib/use-catalog'

export function App() {
  const [state, actions] = useAppState()
  const iconStyles = useIconStyles(state.mode === 'icons')
  const illustrationStyles = useIllustrationStyles(state.mode === 'illustrations')
  const catalogHandle = useCatalog(state.mode === 'icons')

  const showResults =
    state.mode === 'icons'
      ? Boolean(state.q || state.style || state.category || state.icon)
      : Boolean(state.q)

  useEffect(() => {
    const noun = state.mode === 'icons' ? '图标' : '插图'
    document.title = state.q
      ? `${state.q} · ${noun} · LibreIllu`
      : `LibreIllu · 免费${noun}与${state.mode === 'icons' ? '插图' : '图标'}`
  }, [state.mode, state.q])

  // 搜索词或筛选变化时回到顶部（打开详情不触发）
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [state.q, state.style, state.category, state.mode])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-float"
      >
        跳到主要内容
      </a>

      <AppHeader mode={state.mode} onMode={actions.changeMode} onHome={actions.goHome} />

      <main id="main" className="flex-1">
        {showResults ? (
          state.mode === 'icons' ? (
            <IconsView
              state={state}
              actions={actions}
              catalogHandle={catalogHandle}
              iconStyles={iconStyles.styles}
            />
          ) : (
            <IllustrationsView
              state={state}
              actions={actions}
              illustrationStyles={illustrationStyles.styles}
            />
          )
        ) : (
          <LandingView
            mode={state.mode}
            iconStyles={iconStyles.styles}
            iconStylesLoading={iconStyles.loading}
            illustrationStyles={illustrationStyles.styles}
            illustrationStylesLoading={illustrationStyles.loading}
            onSearch={actions.submitSearch}
            onSelectStyle={(slug) => actions.selectStyle(slug, { push: true })}
          />
        )}
      </main>
    </div>
  )
}
