import type { Illustration, IllustrationPage } from './types'

/**
 * 插图搜索接口（igoutu.cn 插图站实际调用，CORS 全开、无需登录）。
 *
 *   GET https://search-ouch-origin.icons8.com/api/illustrations/ouch/search?search=<词>&limit=&page=
 *
 * 参数名是 search（不是 q/term/query）；中文关键词会 400，只能传英文。
 * 返回 { total, illustrations: [...] }，每条含多档预览图地址。
 */
export const ILLUSTRATION_API =
  'https://search-ouch-origin.icons8.com/api/illustrations/ouch/search'

const TIMEOUT = 20_000
/** 接口实测每页最多返回 10 条，传更大的 limit 也会被钳制 */
export const ILLUSTRATION_PAGE_SIZE = 10

export interface RawIllustration {
  id: string
  pretty_id: string
  heading: string
  free_distribution?: boolean
  created_at?: string
  styles?: Array<{ pretty_id: string; title: string }>
  tags?: Array<{ pretty_id: string; title: string }>
  thumb_xs1x?: { url: string; width: number; height: number }
  thumb1x?: { url: string; width: number; height: number }
  preview1x?: { url: string; width: number; height: number }
  preview2x?: { url: string; width: number; height: number }
}

function mapIllustration(raw: RawIllustration): Illustration {
  const preview = raw.preview1x ?? raw.thumb1x
  return {
    id: raw.id,
    prettyId: raw.pretty_id,
    title: raw.heading || raw.pretty_id,
    preview: preview?.url ?? '',
    thumb: raw.thumb1x?.url ?? raw.thumb_xs1x?.url ?? '',
    width: preview?.width,
    height: preview?.height,
    styles: (raw.styles ?? []).map((s) => ({ slug: s.pretty_id, title: s.title })),
    tags: (raw.tags ?? []).map((t) => t.title).filter(Boolean),
    free: raw.free_distribution,
    createdAt: raw.created_at,
  }
}

export async function searchIllustrations(
  fetchImpl: typeof fetch,
  options: {
    search: string
    stylePrettyId?: string
    page?: number
    limit?: number
    signal?: AbortSignal
  },
): Promise<IllustrationPage> {
  const params = new URLSearchParams({
    search: options.search,
    limit: String(options.limit ?? ILLUSTRATION_PAGE_SIZE),
    page: String(options.page ?? 1),
  })
  if (options.stylePrettyId) params.set('style_pretty_id', options.stylePrettyId)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
  const signal = options.signal ?? ctrl.signal
  try {
    const res = await fetchImpl(`${ILLUSTRATION_API}?${params}`, { signal })
    if (!res.ok) throw new Error(`插图搜索 HTTP ${res.status}`)
    const body = (await res.json()) as { total?: number; illustrations?: RawIllustration[] }
    const items = (body.illustrations ?? []).map(mapIllustration).filter((i) => i.preview)
    return { items, total: body.total ?? items.length }
  } finally {
    clearTimeout(timer)
  }
}

/** 插图详情页（原站）地址，用于「查看原图」。 */
export function illustrationPageUrl(prettyId: string): string {
  return `https://igoutu.cn/illustrations/${prettyId}`
}
