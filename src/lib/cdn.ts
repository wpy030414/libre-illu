/**
 * 图标 CDN 地址构造。
 *
 * 实测（2026-11）：img.icons8.com 对任意 Origin 返回 Access-Control-Allow-Origin: *，
 * 因此浏览器可直接 fetch 成 Blob、或用于 <a download> 下载。
 */
export const CDN_ORIGIN = 'https://img.icons8.com'

/** 站点提供的下载档位。CDN 实际支持任意整数尺寸（服务端缩放），此处仅列离散档。 */
export const ICON_SIZES = [48, 96, 144, 240, 1600] as const
export type IconSize = (typeof ICON_SIZES)[number]

/** set = 接口的 platform，name = 接口的 commonName */
export function iconUrl(set: string, name: string, size: number = 50): string {
  return `${CDN_ORIGIN}/${encodeURIComponent(set)}/${size}/${encodeURIComponent(name)}.png`
}

/** SVG 为矢量，URL 不带尺寸段。注意：icons8 将 SVG 划为付费格式，可用性需运行时探测。 */
export function iconSvgUrl(set: string, name: string): string {
  return `${CDN_ORIGIN}/${encodeURIComponent(set)}/${encodeURIComponent(name)}.svg`
}

/** 下载文件名：<set>-<name>-<size>x<size>.png */
export function downloadName(set: string, name: string, size: number): string {
  return `${set}-${name}-${size}x${size}.png`
}

/**
 * 以 Blob 形式取回图片并触发下载。
 * 走 fetch 而非 <a href> 是为了拿到文件名、并在 CORS 允许时把二进制落到本地。
 */
export async function downloadIcon(set: string, name: string, size: number): Promise<void> {
  const res = await fetch(iconUrl(set, name, size), { mode: 'cors' })
  if (!res.ok) throw new Error(`下载失败：HTTP ${res.status}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName(set, name, size)
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    // 交给浏览器完成下载后再释放
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
}
