import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Download, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SmartImage } from '@/components/media/smart-image'
import { downloadUrl } from '@/lib/download'
import type { Illustration } from '@/lib/types'

interface IllustrationDetailProps {
  item: Illustration | null
  items: Illustration[]
  onSelect: (item: Illustration) => void
  onClose: () => void
  onSearch: (term: string) => void
}

/** 插图详情：大图、元数据、下载/复制/原站，以及同风格推荐。 */
export function IllustrationDetail({
  item,
  items,
  onSelect,
  onClose,
  onSearch,
}: IllustrationDetailProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setBusy(false)
    setError(null)
    setCopied(false)
  }, [item])

  const related = useMemo(() => {
    if (!item) return []
    const styles = new Set(item.styles.map((style) => style.slug))
    return items
      .filter(
        (candidate) =>
          candidate.prettyId !== item.prettyId &&
          candidate.styles.some((style) => styles.has(style.slug)),
      )
      .slice(0, 6)
  }, [item, items])

  useEffect(() => {
    if (!item) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      const target = event.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      const index = items.findIndex((candidate) => candidate.prettyId === item.prettyId)
      if (index < 0) return
      const next = items[index + (event.key === 'ArrowRight' ? 1 : -1)]
      if (next) {
        event.preventDefault()
        onSelect(next)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item, items, onSelect])

  async function download() {
    if (!item) return
    setBusy(true)
    setError(null)
    try {
      await downloadUrl(item.preview, `${item.prettyId}.webp`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!item) return
    try {
      await navigator.clipboard.writeText(item.preview)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('复制失败：浏览器不允许访问剪贴板')
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[92dvh] max-w-5xl overflow-y-auto p-5 sm:p-6"
      >
        {item && (
          <>
            <div className="pr-6">
              <DialogTitle className="text-base font-semibold tracking-tight">
                {item.title}
              </DialogTitle>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.styles.map((style) => (
                  <Badge key={style.slug} variant="secondary">
                    {style.title}
                  </Badge>
                ))}
                {item.tags.slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onSearch(tag)}
                    className="rounded-md border border-border/70 px-2 py-0.5 text-xs text-foreground/75 transition-colors hover:border-brand/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[1.35fr_1fr]">
              <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/30">
                <SmartImage
                  src={item.preview}
                  alt={item.title}
                  eager
                  className="w-full bg-muted/10"
                  imgClassName="h-auto max-h-[56dvh] w-full object-contain"
                  fallback={<span className="text-xs text-muted-foreground">加载失败</span>}
                />
              </div>

              <div className="flex min-w-0 flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  {item.width && item.height ? `${item.width} × ${item.height}` : '插图'}
                  {item.free ? ' · 可免费使用' : ''}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={download} disabled={busy} className="rounded-xl">
                    {busy ? <Loader2 className="animate-spin" /> : <Download />}
                    下载 WebP
                  </Button>
                  <Button variant="outline" onClick={copy} className="rounded-xl">
                    {copied ? <Check /> : <Copy />}
                    {copied ? '已复制' : '复制链接'}
                  </Button>
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                {related.length > 0 && (
                  <div className="mt-auto border-t border-border/70 pt-3">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      同风格更多
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {related.map((candidate) => (
                        <button
                          key={candidate.prettyId}
                          type="button"
                          onClick={() => onSelect(candidate)}
                          className="overflow-hidden rounded-lg border border-border/60 bg-card transition-colors hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <img
                            src={candidate.thumb || candidate.preview}
                            alt={candidate.title}
                            className="aspect-square w-full object-contain p-1"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
