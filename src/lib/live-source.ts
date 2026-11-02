import { CatalogBuilder, fetchPage, type Fetcher } from './icons8-api'
import { fetchStyles, type StyleMeta } from './styles-catalog'
import type { CatalogSource } from './data-source'
import type { Catalog } from './types'

/**
 * 实时数据源：浏览器直接调用 igoutu.cn 的公开接口，无离线快照、无构建期抓取。
 *
 * 懒加载（分批）策略：
 *   - 启动只读风格目录（一个 HTML 页），不拉任何图标
 *   - 需要更多结果时调用 loadBatch：从目标风格里并发取几页，攒够就停，不预拉全量
 *   - 已取到的页会缓存，同一风格同一页不重复请求
 *
 * 为什么需要「多取一些」：接口按热度返回，单个风格前几页往往覆盖不到冷门关键词，
 * 所以目标是一个能让界面先有内容的下限（见 MIN_SAMPLE）。
 */
export interface LiveCatalogOptions {
  /** 单次 loadBatch 最多并发几页 */
  pageConcurrency?: number
  fetcher?: Fetcher
}

export interface BatchRequest {
  /** 优先从这些风格里取（用户选中的风格排第一） */
  styles: string[]
  /** 目标：目录里至少要攒够多少条 */
  need: number
}

export interface LiveCatalogSource extends CatalogSource {
  loadBatch(request: BatchRequest): Promise<Catalog>
  loadedSets(): string[]
}

/** 单批取数的页面上限，避免一次打太多请求 */
const PAGES_PER_BATCH = 6

export function liveCatalogSource(options: LiveCatalogOptions = {}): LiveCatalogSource {
  const fetcher: Fetcher = options.fetcher ?? ((url, init) => fetch(url, init))
  const builder = new CatalogBuilder()
  let styles: StyleMeta[] = []
  let ready = false
  /** 每个风格已取到的页数 */
  const pagesTaken = new Map<string, number>()
  const exhausted = new Set<string>()
  let running: Promise<void> | null = null

  const snapshot = () => builder.build('icons8-api-live')
  const metaOf = (slug: string) => styles.find((s) => s.apiCode === slug)
  const byCount = () => [...styles].sort((a, b) => b.quantity - a.quantity)

  const totalPages = (style: StyleMeta) =>
    style.quantity > 0 ? Math.ceil(style.quantity / 100) : Number.POSITIVE_INFINITY

  /** 取某一页（带缓存，不重复请求）。 */
  async function takePage(style: StyleMeta, page: number): Promise<void> {
    if (page >= totalPages(style)) {
      exhausted.add(style.apiCode)
      return
    }
    const res = await fetchPage(fetcher, { style: style.apiCode, offset: page * 100 })
    if (res.end || res.icons.length === 0) {
      exhausted.add(style.apiCode)
      return
    }
    builder.addPage(style.apiCode, res.icons)
    pagesTaken.set(style.apiCode, Math.max(pagesTaken.get(style.apiCode) ?? 0, page + 1))
    builder.setStyleMeta(style.apiCode, style.title, style.quantity)
  }

  /** 为一批风格规划接下来该取哪些页。 */
  function planPages(
    targets: StyleMeta[],
    budget: number,
  ): Array<{ style: StyleMeta; page: number }> {
    const plan: Array<{ style: StyleMeta; page: number }> = []
    const cursor = new Map(targets.map((s) => [s.apiCode, pagesTaken.get(s.apiCode) ?? 0]))
    // 轮转取页，让每个目标风格都能分到一点
    let progressed = true
    while (plan.length < budget && progressed) {
      progressed = false
      for (const style of targets) {
        if (plan.length >= budget) break
        if (exhausted.has(style.apiCode)) continue
        const page = cursor.get(style.apiCode) ?? 0
        if (page >= totalPages(style)) continue
        plan.push({ style, page })
        cursor.set(style.apiCode, page + 1)
        progressed = true
      }
    }
    return plan
  }

  return {
    id: 'live-icons8',

    /** 只加载风格目录，一个图标都不拉。 */
    async load(): Promise<Catalog> {
      styles = await fetchStyles(fetcher)
      for (const s of styles) builder.ensureSet(s.apiCode, s.title, s.quantity)
      ready = true
      return snapshot()
    },

    /**
     * 按需取图标：选中风格时只取该风格（按页轮转）；
     * 未选风格时按图标数从多到少轮流取多个风格的首页。
     */
    async loadBatch(request: BatchRequest): Promise<Catalog> {
      if (!ready) await this.load()
      if (running) await running.catch(() => undefined)
      if (builder.icons.size >= request.need) return snapshot()

      const targets: StyleMeta[] =
        request.styles.length > 0
          ? request.styles.map(metaOf).filter((s): s is StyleMeta => Boolean(s))
          : byCount().slice(0, 20)

      const plan = planPages(targets, PAGES_PER_BATCH)
      if (plan.length === 0) return snapshot()

      const concurrency = Math.max(1, options.pageConcurrency ?? 4)
      const queue = [...plan]
      running = (async () => {
        await Promise.all(
          Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
            while (queue.length > 0) {
              const job = queue.shift()
              if (!job) return
              try {
                await takePage(job.style, job.page)
              } catch (err) {
                console.warn(`[catalog] ${job.style.apiCode} 第 ${job.page} 页失败：`, err)
                exhausted.add(job.style.apiCode)
              }
            }
          }),
        )
      })().finally(() => {
        running = null
      })
      await running
      return snapshot()
    },

    loadedSets: () => [...pagesTaken.keys()],
  }
}
