/**
 * 以 Blob 形式取回图片并触发下载。
 * 走 fetch 而不是 <a download>，是为了稳定拿到文件名，并在 CORS 允许时把二进制落到本地。
 */
export async function downloadUrl(url: string, filename: string): Promise<void> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error(`下载失败：HTTP ${res.status}`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
  }
}
