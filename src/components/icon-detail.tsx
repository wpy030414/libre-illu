import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Download, FileCode2, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { DiscreteSlider } from '@/components/ui/discrete-slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SmartImage } from '@/components/media/smart-image'
import { downloadIcon, ICON_SIZES, iconSvgUrl, iconUrl } from '@/lib/cdn'
import { needsDarkBackdrop } from '@/lib/icon-appearance'
import { cn } from '@/lib/utils'
import type { Catalog, Icon } from '@/lib/types'

interface IconDetailProps {
  icon: Icon | null
  catalog: Catalog | null
  /** 当前结果集，用于左右键切换 */
  items: Icon[]
  onSelect: (icon: Icon) => void
  onClose: () => void
}

/** 图标详情：大预览、尺寸滑轨、下载/复制，以及同款跨风格推荐。 */
export function IconDetail({ icon, catalog, items, onSelect, onClose }: IconDetailProps) {
  const [size, setSize] = useState<number>(240)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'png' | 'svg' | null>(null)
  const [svgAvailable, setSvgAvailable] = useState(false)

  useEffect(() => {
    setError(null)
    setBusy(false)
    setCopied(null)
    setSize(240)
  }, [icon])

  const set = icon ? catalog?.sets.find((item) => item.slug === icon.set) : undefined
  const cdnSet = set?.cdnPath ?? icon?.set ?? ''
  const pngUrl = icon ? iconUrl(cdnSet, icon.commonName, size) : ''
  const svgUrl = icon ? iconSvgUrl(cdnSet, icon.commonName) : ''
  const categoryNames = (icon?.categories ?? []).map(
    (slug) =>
      catalog?.categories.find((category) => category.slug === slug)?.name ?? slug.split('--')[0],
  )

  // icons8 将 SVG 划为付费格式（CDN 返回 403 PAID_FORMAT），可用性逐图标探测
  useEffect(() => {
    if (!icon) return
    const controller = new AbortController()
    fetch(iconSvgUrl(cdnSet, icon.commonName), {
      method: 'HEAD',
      mode: 'cors',
      signal: controller.signal,
    })
      .then((res) => setSvgAvailable(res.ok))
      .catch(() => setSvgAvailable(false))
    return () => {
      controller.abort()
      setSvgAvailable(false)
    }
  }, [icon, cdnSet])

  const related = useMemo(() => {
    if (!icon || !catalog) return []
    const sameName = catalog.icons.filter(
      (item) => item.commonName === icon.commonName && item.set !== icon.set,
    )
    const siblings = catalog.icons.filter(
      (item) => item.set === icon.set && item.commonName !== icon.commonName,
    )
    const seen = new Set<string>()
    return [...sameName, ...siblings]
      .filter((item) => {
        const key = `${item.set}/${item.commonName}`
        if (seen.has(key) || (item.set === icon.set && item.commonName === icon.commonName)) {
          return false
        }
        seen.add(key)
        return true
      })
      .slice(0, 8)
  }, [icon, catalog])

  // 左右方向键在当前结果集中切换
  useEffect(() => {
    if (!icon) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      const target = event.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'SELECT' ||
        // 滑轨聚焦时方向键留给滑轨切档
        target?.closest('[role="slider"]')
      ) {
        return
      }
      const index = items.findIndex(
        (item) => item.set === icon.set && item.commonName === icon.commonName,
      )
      if (index < 0) return
      const next = items[index + (event.key === 'ArrowRight' ? 1 : -1)]
      if (next) {
        event.preventDefault()
        onSelect(next)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [icon, items, onSelect])

  async function handleDownload() {
    if (!icon) return
    setBusy(true)
    setError(null)
    try {
      await downloadIcon(cdnSet, icon.commonName, size)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleCopy(kind: 'png' | 'svg') {
    try {
      await navigator.clipboard.writeText(kind === 'png' ? pngUrl : svgUrl)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      setError('复制失败：浏览器不允许访问剪贴板')
    }
  }

  return (
    <Dialog open={icon !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[92dvh] max-w-3xl overflow-y-auto p-5 sm:p-6"
      >
        {icon && (
          <>
            <div className="flex items-start justify-between gap-4 pr-6">
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  {icon.name}
                </DialogTitle>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{set?.name ?? icon.set}</Badge>
                  {icon.isColor && <Badge variant="outline">彩色</Badge>}
                  {icon.isAnimated && <Badge variant="outline">动态</Badge>}
                  {categoryNames
                    .filter((name) => name !== (set?.name ?? icon.set))
                    .slice(0, 4)
                    .map((name) => (
                      <Badge key={name} variant="outline">
                        {name}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[260px_1fr] md:items-start">
              <div
                className={cn(
                  'grid aspect-square place-items-center rounded-xl border border-border/70 p-4',
                  needsDarkBackdrop(icon.set) ? 'bg-neutral-900' : 'checkerboard',
                )}
              >
                <SmartImage
                  src={iconUrl(cdnSet, icon.commonName, 240)}
                  alt={icon.name}
                  eager
                  className="size-full"
                  imgClassName="object-contain"
                  width={256}
                  height={256}
                  fallback={<span className="text-xs text-muted-foreground">加载失败</span>}
                />
              </div>

              <div className="flex min-w-0 flex-col items-stretch gap-3">
                <DiscreteSlider
                  values={ICON_SIZES}
                  value={size}
                  onChange={setSize}
                  format={(value) => `${value}px`}
                  label="PNG 尺寸"
                />
                <code className="truncate rounded-lg bg-muted px-2.5 py-2 text-[11px] leading-5 text-muted-foreground">
                  {pngUrl}
                </code>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleDownload} disabled={busy} className="rounded-xl">
                    {busy ? <Loader2 className="animate-spin" /> : <Download />}
                    下载 PNG
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopy('png')}
                    className="rounded-xl"
                  >
                    {copied === 'png' ? <Check /> : <Copy />}
                    {copied === 'png' ? '已复制' : '复制链接'}
                  </Button>
                  {svgAvailable && (
                    <Button
                      variant="outline"
                      onClick={() => handleCopy('svg')}
                      className="rounded-xl"
                    >
                      {copied === 'svg' ? <Check /> : <FileCode2 />}
                      {copied === 'svg' ? '已复制' : '复制 SVG'}
                    </Button>
                  )}
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            </div>

            {related.length > 0 && (
              <div className="border-t border-border/70 pt-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  同风格更多
                </p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {related.map((item) => (
                    <button
                      key={`${item.set}/${item.commonName}`}
                      type="button"
                      onClick={() => onSelect(item)}
                      title={item.name}
                      className={cn(
                        'aspect-square rounded-lg border border-border/60 p-2 transition-colors hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        needsDarkBackdrop(item.set) ? 'bg-neutral-900' : 'bg-card',
                      )}
                    >
                      <img
                        src={iconUrl(
                          catalog?.sets.find((s) => s.slug === item.set)?.cdnPath ?? item.set,
                          item.commonName,
                          48,
                        )}
                        alt={item.name}
                        className="size-full object-contain"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
