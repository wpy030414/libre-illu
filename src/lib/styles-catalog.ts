import { ICONS8_INDEX, type Fetcher } from './icons8-api'

/**
 * 风格目录：/icons/ 页的 SSR 负载（__NUXT_DATA__）里带 stylesCards，
 * 每项给出 apiCode（= 接口的 style 参数）、title、quantity（官方总量）。
 * 这是唯一一次读 HTML 的地方，其余数据全部走 JSON 接口。
 */
export interface StyleMeta {
  apiCode: string
  title: string
  quantity: number
  /** 官方风格预览图（stylesCards.img），用于首页风格墙 */
  previewUrl?: string
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** 在还原后的负载里找第一个名为 key 的数组字段。 */
function findArrayIn(resolved: unknown, key: string, depth = 0): unknown[] | null {
  if (depth > 12 || resolved == null) return null
  const rec = asRecord(resolved)
  if (rec && Array.isArray(rec[key])) return rec[key] as unknown[]
  const children = Array.isArray(resolved) ? resolved : rec ? Object.values(rec) : []
  for (const child of children) {
    const hit = findArrayIn(child, key, depth + 1)
    if (hit) return hit
  }
  return null
}

/**
 * Nuxt 3 负载是扁平数组：对象/数组的值是下标引用，数值既可能是字面量
 * 也可能是指向另一元素的引用（33 → 13737 → 越界），一路追到越界为止。
 */
export function resolvePayload(payload: unknown[]): unknown {
  const walk = (v: unknown, depth: number): unknown => {
    if (depth > 24) return null
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0) {
      if (v >= payload.length) return v
      return walk(payload[v], depth + 1)
    }
    if (Array.isArray(v)) return v.map((x) => walk(x, depth + 1))
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, val] of Object.entries(v)) out[k] = walk(val, depth + 1)
      return out
    }
    return v
  }
  return walk(payload[1], 0)
}

export function extractNuxtData(html: string): unknown[] | null {
  const m = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) return null
  try {
    return JSON.parse(m[1]) as unknown[]
  } catch {
    return null
  }
}

export function pickStyles(resolved: unknown): StyleMeta[] {
  const list = findArrayIn(resolved, 'stylesCards')?.map(asRecord) ?? []
  const styles: StyleMeta[] = []
  for (const r of list) {
    if (!r) continue
    const apiCode = typeof r.apiCode === 'string' ? r.apiCode : ''
    const title = typeof r.title === 'string' ? r.title : ''
    if (!apiCode || !title) continue
    styles.push({
      apiCode,
      title,
      quantity: typeof r.quantity === 'number' ? r.quantity : 0,
      previewUrl: typeof r.img === 'string' && r.img ? r.img : undefined,
    })
  }
  return styles
}

const CACHE_KEY = 'libreillu:icon-styles:v1'
const CACHE_TTL = 24 * 60 * 60 * 1000

/** 风格目录页约 500KB，解析后只有几十条；会话内缓存，避免首页与结果页重复拉取。 */
function readCache(): StyleMeta[] | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at?: number; styles?: StyleMeta[] }
    if (!parsed.at || Date.now() - parsed.at > CACHE_TTL) return null
    return Array.isArray(parsed.styles) && parsed.styles.length > 0 ? parsed.styles : null
  } catch {
    return null
  }
}

function writeCache(styles: StyleMeta[]): void {
  try {
    if (typeof sessionStorage === 'undefined') return
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), styles }))
  } catch {
    // 隐私模式下写入可能失败，忽略
  }
}

let inflight: Promise<StyleMeta[]> | null = null

/** 读 /icons/ 页并解析风格目录。多个入口同时调用时共用同一个请求。 */
export function fetchStyles(fetchImpl: Fetcher, signal?: AbortSignal): Promise<StyleMeta[]> {
  const cached = readCache()
  if (cached) return Promise.resolve(cached)
  if (inflight) return inflight
  inflight = (async () => {
    const res = await fetchImpl(ICONS8_INDEX, { signal })
    if (!res.ok) throw new Error(`风格目录页 HTTP ${res.status}`)
    const payload = extractNuxtData(await res.text())
    if (!payload) throw new Error('风格目录页没有 __NUXT_DATA__')
    const styles = pickStyles(resolvePayload(payload))
    if (styles.length === 0) throw new Error('风格目录为空')
    writeCache(styles)
    return styles
  })().finally(() => {
    inflight = null
  })
  return inflight
}
