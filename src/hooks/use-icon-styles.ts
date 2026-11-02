import { useEffect, useState } from 'react'
import { fetchStyles, type StyleMeta } from '@/lib/styles-catalog'

export interface IconStylesState {
  styles: StyleMeta[]
  loading: boolean
  error: string | null
}

/** 图标风格目录：首页风格墙与结果页筛选共用，fetchStyles 内部有会话缓存。 */
export function useIconStyles(enabled = true): IconStylesState {
  const [styles, setStyles] = useState<StyleMeta[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    setLoading(true)
    setError(null)
    fetchStyles(fetch)
      .then((list) => {
        if (!alive) return
        setStyles(list)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [enabled])

  return { styles, loading, error }
}
