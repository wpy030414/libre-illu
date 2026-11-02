import { memo, useState } from 'react'
import { Download, ExternalLink, Loader2 } from 'lucide-react'
import { SmartImage } from '@/components/media/smart-image'
import { downloadUrl } from '@/lib/download'
import { illustrationPageUrl } from '@/lib/illustrations-api'
import type { Illustration } from '@/lib/types'

interface IllustrationTileProps {
  item: Illustration
  onSelect: (item: Illustration) => void
  eager?: boolean
}

/** 插图卡片：图片优先、标题弱化，悬停浮出下载与原站入口。 */
export const IllustrationTile = memo(function IllustrationTile({
  item,
  onSelect,
  eager,
}: IllustrationTileProps) {
  const [busy, setBusy] = useState(false)

  async function download(event: React.MouseEvent) {
    event.stopPropagation()
    setBusy(true)
    try {
      await downloadUrl(item.preview, `${item.prettyId}.webp`)
    } catch {
      // 失败不打断浏览
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card p-2 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-card"
      data-testid="illustration-tile"
    >
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`查看 ${item.title}`}
      />
      <div className="pointer-events-none relative overflow-hidden rounded-lg bg-muted/30">
        <SmartImage
          src={item.thumb || item.preview}
          alt={item.title}
          eager={eager}
          className="aspect-square w-full"
          imgClassName="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
          fallback={
            <span className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground">
              加载失败
            </span>
          }
        />
      </div>
      <p className="pointer-events-none mt-2 line-clamp-1 px-0.5 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
        {item.title}
      </p>

      <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={download}
          title="下载 WebP"
          aria-label="下载 WebP"
          className="grid size-7 place-items-center rounded-md border border-border/70 bg-card/95 text-muted-foreground shadow-card backdrop-blur transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
        </button>
        <a
          href={illustrationPageUrl(item.prettyId)}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          title="查看原站"
          aria-label="查看原站"
          className="grid size-7 place-items-center rounded-md border border-border/70 bg-card/95 text-muted-foreground shadow-card backdrop-blur transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  )
})
