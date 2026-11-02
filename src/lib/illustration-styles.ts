import type { Fetcher } from './icons8-api'

/**
 * 插图风格目录（Ouch 前端接口，CORS 全开）。
 * 返回约 349 个风格，含官方缩略图、数量与背景色，用于首页风格墙与结果页筛选。
 */
export const ILLUSTRATION_STYLES_API =
  'https://api-ouch.icons8.com/api/frontend/v1/illustrations/styles?fields=title,pretty_id,icon,thumb1x,generator,free_distribution,backgroundColor'

export interface IllustrationStyle {
  /** 接口的 pretty_id，同时是搜索的 style_pretty_id 参数 */
  slug: string
  title: string
  count: number
  /** 官方风格缩略图 */
  thumb?: string
  /** 风格背景色，例如 #f6e6ec */
  background?: string
}

interface RawStyle {
  title?: string
  pretty_id?: string
  illustrations_count?: number
  background_color?: string | null
  thumb1x?: { url?: string } | null
}

const CACHE_KEY = 'libreillu:illustration-styles:v1'
const CACHE_TTL = 24 * 60 * 60 * 1000

function readCache(): IllustrationStyle[] | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at?: number; styles?: IllustrationStyle[] }
    if (!parsed.at || Date.now() - parsed.at > CACHE_TTL) return null
    return Array.isArray(parsed.styles) && parsed.styles.length > 0 ? parsed.styles : null
  } catch {
    return null
  }
}

function writeCache(styles: IllustrationStyle[]): void {
  try {
    if (typeof sessionStorage === 'undefined') return
    // 只缓存展示需要的字段，减小体积
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), styles }))
  } catch {
    // 忽略写入失败
  }
}

let inflight: Promise<IllustrationStyle[]> | null = null

export function fetchIllustrationStyles(
  fetchImpl: Fetcher = fetch,
  signal?: AbortSignal,
): Promise<IllustrationStyle[]> {
  const cached = readCache()
  if (cached) return Promise.resolve(cached)
  if (inflight) return inflight
  inflight = (async () => {
    const res = await fetchImpl(ILLUSTRATION_STYLES_API, { signal })
    if (!res.ok) throw new Error(`插图风格目录 HTTP ${res.status}`)
    const body = (await res.json()) as unknown
    if (!Array.isArray(body)) throw new Error('插图风格目录格式异常')
    const styles = (body as RawStyle[])
      .map((raw): IllustrationStyle | null => {
        if (!raw.pretty_id || !raw.title) return null
        return {
          slug: raw.pretty_id,
          title: raw.title,
          count: typeof raw.illustrations_count === 'number' ? raw.illustrations_count : 0,
          thumb: raw.thumb1x?.url,
          background: raw.background_color ?? undefined,
        }
      })
      .filter((s): s is IllustrationStyle => s !== null)
      .sort((a, b) => b.count - a.count)
    if (styles.length === 0) throw new Error('插图风格目录为空')
    writeCache(styles)
    return styles
  })().finally(() => {
    inflight = null
  })
  return inflight
}
