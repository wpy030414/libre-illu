import { useCallback, useEffect, useRef, useState } from 'react'
import { searchIllustrations } from '@/lib/illustrations-api'
import type { Illustration } from '@/lib/types'

export type IllustrationStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface IllustrationResults {
  items: Illustration[]
  total: number
  status: IllustrationStatus
  error: string | null
  loadingMore: boolean
  hasMore: boolean
  loadMore: () => void
  reload: () => void
}

/**
 * 插图搜索结果：搜索词或风格变化时从第 1 页重取，触底追加下一页。
 * 接口每页 10 条，按 id 去重，避免分页重叠。
 */
export function useIllustrationResults(options: {
  search: string
  stylePrettyId: string
  enabled: boolean
}): IllustrationResults {
  const { search, stylePrettyId, enabled } = options
  const [items, setItems] = useState<Illustration[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<IllustrationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      if (replace) {
        setStatus('loading')
        setError(null)
      } else {
        setLoadingMore(true)
      }
      try {
        const res = await searchIllustrations(fetch, {
          search,
          stylePrettyId,
          page: nextPage,
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        setItems((prev) => {
          if (replace) return res.items
          const seen = new Set(prev.map((item) => item.id))
          return [...prev, ...res.items.filter((item) => !seen.has(item.id))]
        })
        setTotal(res.total)
        setPage(nextPage)
        setStatus('ready')
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      } finally {
        if (!controller.signal.aborted) setLoadingMore(false)
      }
    },
    [search, stylePrettyId],
  )

  useEffect(() => {
    if (!enabled || !search.trim()) {
      abortRef.current?.abort()
      setItems([])
      setTotal(0)
      setPage(0)
      setStatus('idle')
      setError(null)
      return
    }
    setItems([])
    setTotal(0)
    void load(1, true)
    return () => abortRef.current?.abort()
  }, [enabled, search, stylePrettyId, load])

  const hasMore = status === 'ready' && items.length < total

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return
    void load(page + 1, false)
  }, [hasMore, loadingMore, load, page])

  const reload = useCallback(() => {
    if (search.trim()) void load(1, true)
  }, [load, search])

  return { items, total, status, error, loadingMore, hasMore, loadMore, reload }
}
