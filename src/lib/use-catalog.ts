import { useCallback, useEffect, useRef, useState } from 'react'
import { createCatalogSource } from './catalog-loader'
import type { Catalog } from './types'

type CatalogState =
  | { status: 'loading'; catalog: null; error: null }
  | { status: 'ready'; catalog: Catalog; error: null }
  | { status: 'error'; catalog: null; error: string }

export interface CatalogHandle {
  state: CatalogState
  /** 再取一批图标；返回最新目录，便于调用方判断是否还有新增 */
  loadMore: (options: { style: string; need: number }) => Promise<Catalog | null>
  /** 是否有取数任务在跑 */
  busy: boolean
  reload: () => void
}

export function useCatalog(enabled = true): CatalogHandle {
  const [state, setState] = useState<CatalogState>({
    status: 'loading',
    catalog: null,
    error: null,
  })
  const [busy, setBusy] = useState(false)
  const sourceRef = useRef(createCatalogSource())
  const guard = useRef<string>('')

  const run = useCallback(() => {
    setState({ status: 'loading', catalog: null, error: null })
    const source = createCatalogSource()
    sourceRef.current = source
    guard.current = ''
    source
      .load()
      .then((catalog) => setState({ status: 'ready', catalog, error: null }))
      .catch((err: unknown) => {
        setState({
          status: 'error',
          catalog: null,
          error: err instanceof Error ? err.message : String(err),
        })
      })
  }, [])

  // 只在首次启用时初始化，切换模式不重置已加载的数据
  const started = useRef(false)
  useEffect(() => {
    if (!enabled || started.current) return
    started.current = true
    run()
  }, [enabled, run])

  /** 同一 (style, need) 不重复触发，防止滚动事件把请求打爆。 */
  const loadMore = useCallback(
    (options: { style: string; need: number }): Promise<Catalog | null> => {
      const key = `${options.style}:${options.need}`
      if (guard.current === key) return Promise.resolve(null)
      guard.current = key
      setBusy(true)
      return sourceRef.current
        .loadBatch({ styles: options.style ? [options.style] : [], need: options.need })
        .then((catalog) => {
          setState({ status: 'ready', catalog, error: null })
          return catalog
        })
        .catch((err: unknown) => {
          console.warn('[catalog] 取数失败：', err)
          return null
        })
        .finally(() => setBusy(false))
    },
    [],
  )

  return { state, loadMore, busy, reload: run }
}
