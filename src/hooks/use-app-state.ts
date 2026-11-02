import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Mode } from '@/lib/types'

const MODE_KEY = 'libreillu-mode'

export interface AppState {
  mode: Mode
  /** 已提交的搜索词 */
  q: string
  /** 图标风格 slug / 插图风格 pretty_id */
  style: string
  /** 图标分类 slug */
  category: string
  /** 图标详情：<set>/<commonName> */
  icon: string
  /** 插图详情：pretty_id */
  ill: string
}

export interface AppActions {
  submitSearch: (text: string) => void
  changeMode: (mode: Mode) => void
  selectStyle: (style: string, options?: { push?: boolean }) => void
  selectCategory: (category: string) => void
  clearFilters: () => void
  openIconDetail: (key: string) => void
  openIllustrationDetail: (id: string) => void
  closeDetail: () => void
  goHome: () => void
}

function readSavedMode(): Mode {
  try {
    const saved = localStorage.getItem(MODE_KEY)
    if (saved === 'icons' || saved === 'illustrations') return saved
  } catch {
    // 隐私模式
  }
  return 'icons'
}

function readState(): AppState {
  if (typeof window === 'undefined') {
    return { mode: 'icons', q: '', style: '', category: '', icon: '', ill: '' }
  }
  const params = new URLSearchParams(window.location.search)
  const modeParam = params.get('mode')
  const mode: Mode =
    modeParam === 'illustrations' || modeParam === 'icons' ? modeParam : readSavedMode()
  return {
    mode,
    q: params.get('q') ?? '',
    style: params.get('set') ?? '',
    category: params.get('cat') ?? '',
    icon: params.get('icon') ?? '',
    ill: params.get('ill') ?? '',
  }
}

function toUrl(state: AppState): string {
  const params = new URLSearchParams()
  if (state.mode === 'illustrations') params.set('mode', 'illustrations')
  if (state.q) params.set('q', state.q)
  if (state.style) params.set('set', state.style)
  if (state.category) params.set('cat', state.category)
  if (state.icon) params.set('icon', state.icon)
  if (state.ill) params.set('ill', state.ill)
  const qs = params.toString()
  return `${window.location.pathname}${qs ? `?${qs}` : ''}`
}

/**
 * URL 是视图状态的唯一来源：刷新、分享链接、浏览器前进后退都能还原。
 * 搜索/切换模式/进入详情用 push；筛选/关闭详情用 replace。
 */
export function useAppState(): [AppState, AppActions] {
  const [state, setState] = useState<AppState>(readState)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const onPop = () => setState(readState())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.mode = state.mode
    try {
      localStorage.setItem(MODE_KEY, state.mode)
    } catch {
      // 忽略
    }
  }, [state.mode])

  const commit = useCallback((next: AppState, push: boolean) => {
    const url = toUrl(next)
    const current = `${window.location.pathname}${window.location.search}`
    if (url !== current) {
      if (push) window.history.pushState(null, '', url)
      else window.history.replaceState(null, '', url)
    }
    setState(next)
  }, [])

  const update = useCallback(
    (patch: Partial<AppState>, push: boolean) => {
      commit({ ...stateRef.current, ...patch }, push)
    },
    [commit],
  )

  const actions = useMemo<AppActions>(
    () => ({
      submitSearch: (text) => update({ q: text.trim(), icon: '', ill: '' }, true),
      changeMode: (mode) => {
        if (stateRef.current.mode === mode) return
        update({ mode, q: '', style: '', category: '', icon: '', ill: '' }, true)
      },
      selectStyle: (style, options) =>
        update({ style, category: '', icon: '', ill: '' }, options?.push ?? false),
      selectCategory: (category) => update({ category }, false),
      clearFilters: () => update({ style: '', category: '' }, false),
      openIconDetail: (key) => update({ icon: key }, true),
      openIllustrationDetail: (id) => update({ ill: id }, true),
      closeDetail: () => {
        if (!stateRef.current.icon && !stateRef.current.ill) return
        update({ icon: '', ill: '' }, false)
      },
      goHome: () => update({ q: '', style: '', category: '', icon: '', ill: '' }, true),
    }),
    [update],
  )

  return [state, actions]
}
