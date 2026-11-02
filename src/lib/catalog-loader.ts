import { liveCatalogSource, type LiveCatalogSource } from './live-source'

/**
 * 数据源装配点：整个站点只有这里决定数据从哪来。
 * 目前唯一实现是实时接口（浏览器直连，无离线快照、无构建期抓取）。
 */
export function createCatalogSource(): LiveCatalogSource {
  return liveCatalogSource()
}
