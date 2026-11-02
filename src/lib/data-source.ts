import type { Catalog } from './types'

/**
 * 图标数据源接口。当前实现：live-source（浏览器直连 igoutu.cn 公开接口）。
 */
export interface CatalogSource {
  readonly id: string
  /** 只加载风格目录，不拉图标 */
  load(): Promise<Catalog>
  /** 按需加载指定风格的图标 */
  ensureStyles?(slugs: string[]): Promise<Catalog>
  loadedSets?(): string[]
}
