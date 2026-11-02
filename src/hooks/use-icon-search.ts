import { useCallback, useEffect, useRef, useState } from 'react'
import { searchIcons, searchIconToIcon } from '@/lib/icons8-api'
import type { Icon } from '@/lib/types'

export type IconSearchStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface IconSearchResults {
  items: Icon[]
  total: number
  status: IconSearchStatus
  error: string | null
  loadingMore: boolean
  hasMore: boolean
  loadMore: () => void
  reload: () => void
}

/**
 * 图标关键词搜索：直连官方搜索接口，按 offset 分页。
 *
 * 与浏览模式的区别：浏览模式在已拉取的样本里本地过滤，冷门词只能命中零星几条；
 * 搜索模式让服务端按相关度返回，总数与 igoutu.cn 搜索结果页一致。
 */
export function useIconSearch(options: {
  term: string
  style: string
  category: string
  enabled: boolean
}): IconSearchResults {
  const { term, style, category, enabled } = options
  const [rawItems, setRawItems] = useState<Icon[]>([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<IconSearchStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  /** 同步的加载中标记：state 更新有延迟，避免同一帧内重复触发分页 */
  const loadingRef = useRef(false)
  /** 请求代号：只有最新一次请求能清除 loading 标记 */
  const runRef = useRef(0)
  /** 分页游标：offset = 下一批起点，loaded = 已取回的原始条数，maxOffset = 接口上限 */
  const paging = useRef({ offset: 0, loaded: 0, maxOffset: 0 })

  const load = useCallback(
    async (replace: boolean) => {
      const text = term.trim()
      if (!text) return
      // 新关键词要能打断旧请求；同一搜索的翻页则忽略重入
      if (!replace && loadingRef.current) return
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const run = ++runRef.current
      loadingRef.current = true

      if (replace) {
        setStatus('loading')
        setError(null)
        paging.current = { offset: 0, loaded: 0, maxOffset: 0 }
      } else {
        setLoadingMore(true)
      }

      const offset = replace ? 0 : paging.current.offset
      try {
        const page = await searchIcons(fetch, {
          term: text,
          offset,
          style: style || undefined,
          signal: controller.signal,
        })
        if (controller.signal.aborted) return

        const incoming = page.icons
          .map(searchIconToIcon)
          .filter((icon): icon is Icon => icon !== null)
        paging.current = {
          offset: offset + page.icons.length,
          loaded: (replace ? 0 : paging.current.loaded) + page.icons.length,
          maxOffset: page.maxOffset,
        }

        setRawItems((prev) => {
          if (replace) return incoming
          const seen = new Set(prev.map((icon) => `${icon.set}/${icon.commonName}`))
          return [
            ...prev,
            ...incoming.filter((icon) => !seen.has(`${icon.set}/${icon.commonName}`)),
          ]
        })
        setTotal(page.total)
        setStatus('ready')
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      } finally {
        if (runRef.current === run) loadingRef.current = false
        if (!controller.signal.aborted) setLoadingMore(false)
      }
    },
    [term, style],
  )

  // 关键词/风格变化时从第 1 页重取
  useEffect(() => {
    if (!enabled || !term.trim()) {
      abortRef.current?.abort()
      loadingRef.current = false
      setRawItems([])
      setTotal(0)
      setStatus('idle')
      setError(null)
      paging.current = { offset: 0, loaded: 0, maxOffset: 0 }
      return
    }
    setRawItems([])
    setTotal(0)
    void load(true)
    return () => abortRef.current?.abort()
  }, [enabled, term, style, load])

  // 分类筛选没有对应的接口参数，在已取回的结果上过滤
  const items = category ? rawItems.filter((icon) => icon.categories.includes(category)) : rawItems

  const exhausted =
    paging.current.loaded >= paging.current.maxOffset ||
    paging.current.loaded >= total ||
    paging.current.offset === 0
  const hasMore = status === 'ready' && !exhausted

  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return
    void load(false)
  }, [hasMore, load])

  const reload = useCallback(() => {
    if (term.trim()) void load(true)
  }, [load, term])

  return { items, total, status, error, loadingMore, hasMore, loadMore, reload }
}
