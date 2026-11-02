import { useEffect, useState } from 'react'
import { searchIllustrations } from '@/lib/illustrations-api'

export interface LandingTheme {
  term: string
  label: string
  images: string[]
}

const THEMES: Array<{ term: string; label: string }> = [
  { term: 'cat', label: '猫咪' },
  { term: 'home', label: '居家' },
  { term: 'office', label: '办公' },
  { term: 'team', label: '团队' },
  { term: 'business', label: '商务' },
  { term: 'education', label: '教育' },
  { term: 'technology', label: '科技' },
  { term: 'health', label: '健康' },
]

const cache = new Map<string, Promise<LandingTheme>>()

function loadTheme(theme: { term: string; label: string }): Promise<LandingTheme> {
  let task = cache.get(theme.term)
  if (!task) {
    task = searchIllustrations(fetch, { search: theme.term, limit: 4 })
      .then((page) => ({
        term: theme.term,
        label: theme.label,
        images: page.items
          .map((item) => item.thumb || item.preview)
          .filter(Boolean)
          .slice(0, 4),
      }))
      .catch(() => ({ term: theme.term, label: theme.label, images: [] }))
    cache.set(theme.term, task)
  }
  return task
}

/** 插图首页的热门主题预览：每个主题取 4 张缩略图，模块级缓存。 */
export function useLandingThemes(enabled: boolean): { themes: LandingTheme[]; loading: boolean } {
  const [themes, setThemes] = useState<LandingTheme[]>([])
  const [loading, setLoading] = useState(enabled)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    setLoading(true)
    void Promise.all(THEMES.map(loadTheme))
      .then((list) => {
        if (!alive) return
        setThemes(list)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [enabled])

  return { themes, loading }
}
