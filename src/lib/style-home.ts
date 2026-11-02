/**
 * 侧栏风格项使用的 home 图标地址。
 *
 * 绝大多数风格都能直接按 apiCode 取到 CDN 上的 home：
 *   https://img.icons8.com/<apiCode>/48/home.png
 * 少数风格的命名不同或没有 home，见下面两张例外表。
 */

/** home 图标文件名与默认不同的风格 */
const HOME_NAMES: Record<string, string> = {
  // emoji 风格的图标名带后缀
  emoji: 'house-emoji',
  fuzzy: 'house',
  '3d-stickle': 'house',
}

/** CDN 上没有 home 图标的风格：退回官方风格预览图 */
const PREVIEW_ONLY = new Set(['3d-fluent'])

export function styleHomeUrl(apiCode: string, previewUrl?: string): string {
  if (PREVIEW_ONLY.has(apiCode)) return previewUrl ?? ''
  const name = HOME_NAMES[apiCode] ?? 'home'
  return `https://img.icons8.com/${encodeURIComponent(apiCode)}/48/${name}.png`
}
