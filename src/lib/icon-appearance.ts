/**
 * Liquid Glass 一类风格是浅色 / 半透明的，落在浅色底上几乎看不清，
 * 需要换成深色底板。按接口的 platform 判断，属于特例补丁。
 */
const DARK_BACKDROP = new Set(['liquid-glass', 'liquid-glass-color'])

export function needsDarkBackdrop(set: string): boolean {
  return DARK_BACKDROP.has(set)
}
