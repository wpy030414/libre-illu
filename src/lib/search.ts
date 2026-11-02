import type { Catalog, Icon, IconPage, IconQuery } from './types'

/** 归一化：小写、去首尾空白、全角空格转半角。 */
export function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/　/g, ' ')
}

export interface SearchIndex {
  icons: Icon[]
  /** 与 icons 一一对应的可搜索文本（已小写） */
  hay: string[]
}

/** 建索引：把可搜索字段拼成一条小写字符串，避免每次查询重复拼装。 */
export function buildIndex(catalog: Catalog): SearchIndex {
  const catName = new Map(catalog.categories.map((c) => [c.slug, c.name]))
  return {
    icons: catalog.icons,
    hay: catalog.icons.map((icon) => {
      const cats = icon.categories.map((s) => catName.get(s) ?? s).join(' ')
      return `${icon.commonName} ${icon.name} ${cats}`.toLowerCase()
    }),
  }
}

const indexCache = new Map<Catalog, SearchIndex>()

/** 同一份 catalog 只建一次索引。 */
export function getIndex(catalog: Catalog): SearchIndex {
  let index = indexCache.get(catalog)
  if (!index) {
    index = buildIndex(catalog)
    // 只保留最新一份
    for (const key of indexCache.keys()) if (key !== catalog) indexCache.delete(key)
    indexCache.set(catalog, index)
  }
  return index
}

/**
 * 纯函数查询：单次线性扫描，边扫边计数，
 * 超过 limit 后只累加 total，不再创建对象。
 */
export function queryIcons(catalog: Catalog, query: IconQuery = {}): IconPage {
  const words = normalize(query.text ?? '')
    .split(/\s+/)
    .filter(Boolean)
  const { icons, hay } = getIndex(catalog)
  const limit = query.limit ?? icons.length
  const offset = Math.max(0, query.offset ?? 0)

  const items: Icon[] = []
  let total = 0

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i]
    if (query.set && icon.set !== query.set) continue
    if (query.category && !icon.categories.includes(query.category)) continue

    if (words.length > 0) {
      const text = hay[i]
      let ok = true
      for (const w of words) {
        if (!text.includes(w)) {
          ok = false
          break
        }
      }
      if (!ok) continue
    }

    if (total >= offset && items.length < limit) items.push(icon)
    total++
  }

  return { items, total }
}
