/** 站点模式：图标 / 插图。 */
export type Mode = 'icons' | 'illustrations'

/** 图标集（对应 icons8 的 style / platform，例如 color、ios7、m_outlined）。 */
export interface IconSet {
  /** 接口里的 platform，同时是 CDN 路径段：img.icons8.com/<slug>/<size>/<name>.png */
  slug: string
  /** 展示名（来自 /icons/ 页的 title） */
  name: string
  /** 该风格下的分类 slug 列表 */
  categories: string[]
  /** CDN 路径段（未设置时等于 slug） */
  cdnPath?: string
  /** 官方公布的图标总数 */
  count?: number
}

/** 分类：接口返回的 category 名称 + 所属风格。 */
export interface Category {
  /** "<分类名>--<风格>" */
  slug: string
  /** 接口返回的分类名（随 language 参数本地化） */
  name: string
  count?: number
}

/** 单个图标。字段与接口返回一一对应，不做额外推断。 */
export interface Icon {
  /** 接口 id */
  id: string
  /** 接口 name（随 language 参数本地化） */
  name: string
  /** CDN 文件名：img.icons8.com/<platform>/<size>/<commonName>.png */
  commonName: string
  /** 接口 commonId */
  commonId?: string
  /** 所属风格（接口 platform） */
  set: string
  /** 接口 category 对应的一或多个分类 slug */
  categories: string[]
  /** 接口 timestamp（秒） */
  timestamp?: number
  /** 接口 url，如 /icon/16713/whatsapp */
  url?: string
  isColor?: boolean
  isAnimated?: boolean
  free?: boolean
  needBackground?: boolean
}

/** 目录文件格式。 */
export interface Catalog {
  /** 数据格式版本 */
  version: 2
  /** 数据源标识 */
  source: string
  /** 生成时间（ISO 8601） */
  generatedAt: string
  /** 接口语言，例如 zh-CN */
  language?: string
  sets: IconSet[]
  categories: Category[]
  icons: Icon[]
}

/** 查询条件。 */
export interface IconQuery {
  text?: string
  set?: string
  category?: string
  limit?: number
  offset?: number
}

/** 查询结果。 */
export interface IconPage {
  items: Icon[]
  total: number
}

/** 插图（来自插图搜索接口）。 */
export interface Illustration {
  id: string
  /** 接口的 pretty_id，可用于拼接详情页地址 */
  prettyId: string
  /** 接口 heading */
  title: string
  /** 预览图地址（webp） */
  preview: string
  /** 小缩略图地址 */
  thumb: string
  width?: number
  height?: number
  /** 所属风格（style pretty_id → title） */
  styles: Array<{ slug: string; title: string }>
  /** 标签 */
  tags: string[]
  free?: boolean
  /** 接口 created_at */
  createdAt?: string
}

/** 插图查询结果。 */
export interface IllustrationPage {
  items: Illustration[]
  total: number
}
