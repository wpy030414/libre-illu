/**
 * igoutu.cn 图标列表接口的最小客户端。站点在浏览器里直接调用，无离线快照。
 *
 * 实测（2026-11）：
 *   - CORS 全开、无需登录，浏览器可直接调用
 *   - amount 上限 100；offset 越过该风格总量时会把结果钳制到末尾（不是空页）
 *   - language=zh-CN 时 name / category 由接口本地化为中文
 */
import type { Catalog, Category, Icon, IconSet } from '@/lib/types'

export const ICONS8_API = 'https://api-icons.icons8.com/siteApi/icons/v1/latest'
export const ICONS8_INDEX = 'https://igoutu.cn/icons/'
export const PAGE_SIZE = 100
export const DEFAULT_LANGUAGE = 'zh-CN'

/** 接口返回的单条图标，字段名保持接口原样。 */
export interface ApiIcon {
  id: string
  name: string
  platform: string
  timestamp?: number
  url?: string
  commonId?: string
  commonName: string
  category?: string
  isColor?: boolean
  isAnimated?: boolean
  free?: boolean
  needBackground?: boolean
}

export interface ApiPage {
  icons: ApiIcon[]
  end: boolean
}

export function pageUrl(options: {
  style: string
  offset: number
  language?: string
  sortBy?: string
}): string {
  const params = new URLSearchParams({
    amount: String(PAGE_SIZE),
    offset: String(options.offset),
    sortBy: options.sortBy ?? 'mostDownloaded',
    style: options.style,
    language: options.language ?? DEFAULT_LANGUAGE,
  })
  return `${ICONS8_API}?${params}`
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>

/** 拉取一页；404 视为翻页结束。 */
export async function fetchPage(
  fetchImpl: Fetcher,
  options: { style: string; offset: number; language?: string; signal?: AbortSignal },
): Promise<ApiPage> {
  const res = await fetchImpl(pageUrl(options), { signal: options.signal })
  if (res.status === 404) return { icons: [], end: true }
  if (!res.ok) throw new Error(`图标列表 HTTP ${res.status}`)
  const body = (await res.json()) as { icons?: ApiIcon[] }
  const icons = Array.isArray(body.icons) ? body.icons : []
  return { icons, end: icons.length === 0 }
}

/** 可增量累积的目录构建器。 */
export class CatalogBuilder {
  readonly sets = new Map<string, IconSet>()
  readonly categories = new Map<string, Category>()
  readonly icons = new Map<string, Icon>()

  constructor(readonly language: string = DEFAULT_LANGUAGE) {}

  ensureSet(slug: string, name: string, count?: number): IconSet {
    const existing = this.sets.get(slug)
    if (existing) {
      if (name) existing.name = name
      if (typeof count === 'number') existing.count = count
      return existing
    }
    const set: IconSet = { slug, name: name || slug, cdnPath: slug, categories: [], count }
    this.sets.set(slug, set)
    return set
  }

  /** 收录一页接口数据。 */
  addPage(style: string, items: ApiIcon[]): number {
    const set = this.ensureSet(style, style)
    let added = 0
    for (const item of items) {
      if (!item.platform || !item.commonName) continue

      const catSlug = item.category ? `${item.category}--${item.platform}` : undefined
      if (catSlug && item.category) {
        const prev = this.categories.get(catSlug)
        this.categories.set(catSlug, {
          slug: catSlug,
          name: item.category,
          count: (prev?.count ?? 0) + 1,
        })
        if (!set.categories.includes(catSlug)) set.categories.push(catSlug)
      }

      const key = `${item.platform}/${item.commonName}`
      const existing = this.icons.get(key)
      if (existing) {
        if (catSlug && !existing.categories.includes(catSlug)) existing.categories.push(catSlug)
        continue
      }
      this.icons.set(key, {
        id: item.id,
        name: item.name || item.commonName,
        commonName: item.commonName,
        commonId: item.commonId,
        set: item.platform,
        categories: catSlug ? [catSlug] : [],
        timestamp: item.timestamp,
        url: item.url,
        isColor: item.isColor,
        isAnimated: item.isAnimated,
        free: item.free,
        needBackground: item.needBackground,
      })
      added++
    }
    return added
  }

  setStyleMeta(slug: string, name: string, count: number) {
    const set = this.ensureSet(slug, name, count)
    set.name = name
    set.count = count
  }

  build(source: string): Catalog {
    const icons = [...this.icons.values()].sort(
      (a, b) => a.set.localeCompare(b.set) || a.commonName.localeCompare(b.commonName),
    )
    return {
      version: 2,
      source,
      generatedAt: new Date().toISOString(),
      language: this.language,
      sets: [...this.sets.values()].sort((a, b) => a.slug.localeCompare(b.slug)),
      categories: [...this.categories.values()].sort((a, b) => a.slug.localeCompare(b.slug)),
      icons,
    }
  }
}

/**
 * 关键词搜索接口（igoutu.cn 搜索结果页无限滚动时实际调用，CORS 全开）。
 *
 *   GET https://search-app.icons8.com/api/iconsets/v7/search?term=<词>&offset=&amount=
 *
 * 这是唯一能按关键词检索图标的接口：列表接口（/icons/v1/latest）不认任何关键词参数。
 * 返回值 parameters.countAll 即官方结果总数（与 igoutu.cn 页面上的数字一致）。
 * amount 实测可到 200；offset 超过 maxOffset 会被钳制到末尾，需要调用方自己停。
 */
export const ICONS8_SEARCH = 'https://search-app.icons8.com/api/iconsets/v7/search'
export const SEARCH_PAGE_SIZE = 100

export interface ApiSearchIcon extends ApiIcon {
  categoryApiCode?: string
  subcategory?: string
  sourceFormat?: string
}

export interface ApiSearchPage {
  icons: ApiSearchIcon[]
  /** 官方结果总数 */
  total: number
  /** 接口允许的最大偏移 */
  maxOffset: number
}

export async function searchIcons(
  fetchImpl: Fetcher,
  options: {
    term: string
    offset?: number
    amount?: number
    /** 风格过滤（接口的 style 参数，即 platform） */
    style?: string
    language?: string
    signal?: AbortSignal
  },
): Promise<ApiSearchPage> {
  const params = new URLSearchParams({
    // 用 zh 而非 zh-CN：官网页面用 zh，两者结果集略有差异，此处对齐官网
    language: options.language ?? 'zh',
    amount: String(options.amount ?? SEARCH_PAGE_SIZE),
    offset: String(options.offset ?? 0),
    term: options.term,
    // isOuch 决定结果范围：缺省时少 28 条（3734），官网始终带上（3762）
    isOuch: 'true',
    replaceNameWithSynonyms: 'true',
  })
  if (options.style) params.set('style', options.style)
  const res = await fetchImpl(`${ICONS8_SEARCH}?${params}`, { signal: options.signal })
  if (!res.ok) throw new Error(`图标搜索 HTTP ${res.status}`)
  const body = (await res.json()) as {
    icons?: ApiSearchIcon[]
    parameters?: { countAll?: number; maxOffset?: number }
  }
  const icons = Array.isArray(body.icons) ? body.icons : []
  return {
    icons,
    total: body.parameters?.countAll ?? icons.length,
    maxOffset: body.parameters?.maxOffset ?? icons.length,
  }
}

/** 搜索接口的单条结果 → 站点 Icon；分类 slug 规则与目录一致（<分类名>--<风格>）。 */
export function searchIconToIcon(item: ApiSearchIcon): Icon | null {
  if (!item.platform || !item.commonName) return null
  return {
    id: item.id,
    name: item.name || item.commonName,
    commonName: item.commonName,
    commonId: item.commonId,
    set: item.platform,
    categories: item.category ? [`${item.category}--${item.platform}`] : [],
    timestamp: item.timestamp,
    url: item.url,
    isColor: item.isColor,
    isAnimated: item.isAnimated,
    free: item.free,
    needBackground: item.needBackground,
  }
}
