import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { queryIcons } from '@/lib/search'
import type { Catalog, Icon } from '@/lib/types'

const PAGE_SIZE = 120

export interface IconResults {
  items: Icon[]
  total: number
  hasMore: boolean
  increase: () => void
}

/**
 * 图标结果：在已加载的样本里过滤，分页只控制渲染数量。
 * 补样本会让 catalog 变大，这里用首次出现顺序保证已有结果不重排。
 */
export function useIconResults(options: {
  catalog: Catalog | null
  query: string
  style: string
  category: string
  active: boolean
}): IconResults {
  const { catalog, query, style, category, active } = options
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const orderRef = useRef(new Map<string, number>())

  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
    orderRef.current = new Map()
  }, [query, style, category])

  const result = useMemo(
    () =>
      catalog && active
        ? queryIcons(catalog, { text: query, set: style, category, limit: displayCount })
        : { items: [], total: 0 },
    [catalog, active, query, style, category, displayCount],
  )

  const items = useMemo(() => {
    const order = orderRef.current
    const indexed = result.items.map((icon) => {
      const key = `${icon.set}/${icon.commonName}`
      let index = order.get(key)
      if (index === undefined) {
        index = order.size
        order.set(key, index)
      }
      return { icon, index }
    })
    indexed.sort((a, b) => a.index - b.index)
    return indexed.map((entry) => entry.icon)
  }, [result.items])

  const increase = useCallback(() => setDisplayCount((value) => value + PAGE_SIZE), [])

  return {
    items,
    total: result.total,
    hasMore: items.length < result.total,
    increase,
  }
}
