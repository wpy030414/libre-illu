import { useEffect, useState } from 'react'
import { fetchIllustrationStyles, type IllustrationStyle } from '@/lib/illustration-styles'

export interface IllustrationStylesState {
  styles: IllustrationStyle[]
  loading: boolean
  error: string | null
}

/** 插图风格目录：首页展示与结果页筛选共用，fetchIllustrationStyles 内部有会话缓存。 */
export function useIllustrationStyles(enabled = true): IllustrationStylesState {
  const [styles, setStyles] = useState<IllustrationStyle[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    setLoading(true)
    setError(null)
    fetchIllustrationStyles(fetch)
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
