import { memo, useState } from 'react'
import { Check, Copy, Download, Loader2 } from 'lucide-react'
import { SmartImage } from '@/components/media/smart-image'
import { downloadIcon, iconUrl } from '@/lib/cdn'
import { needsDarkBackdrop } from '@/lib/icon-appearance'
import type { Icon, IconSet } from '@/lib/types'
import { cn } from '@/lib/utils'

const PREVIEW_SIZE = 48
const DOWNLOAD_SIZE = 240

interface IconTileProps {
  icon: Icon
  set?: IconSet
  onSelect: (icon: Icon) => void
  eager?: boolean
}

type Action = 'download' | 'copy' | null

/** 图标卡片：整卡可点，悬停浮出下载/复制。 */
export const IconTile = memo(function IconTile({ icon, set, onSelect, eager }: IconTileProps) {
  const [action, setAction] = useState<Action>(null)
  const [copied, setCopied] = useState(false)
  const cdnSet = set?.cdnPath ?? icon.set
  // Liquid Glass 类风格是浅色半透明的，浅底上看不清，垫深色
  const dark = needsDarkBackdrop(icon.set)
  const src = iconUrl(cdnSet, icon.commonName, PREVIEW_SIZE)
  const fullUrl = iconUrl(cdnSet, icon.commonName, DOWNLOAD_SIZE)

  async function download(event: React.MouseEvent) {
    event.stopPropagation()
    setAction('download')
    try {
      await downloadIcon(cdnSet, icon.commonName, DOWNLOAD_SIZE)
    } catch {
      // 失败时保持安静，详情里会给出错误
    } finally {
      setAction(null)
    }
  }

  async function copy(event: React.MouseEvent) {
    event.stopPropagation()
    setAction('copy')
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 剪贴板不可用时忽略
    } finally {
      setAction(null)
    }
  }

  return (
    <div
      className="group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl p-2 transition-colors hover:bg-muted/70 focus-within:bg-muted/70"
      data-testid="icon-tile"
    >
      <button
        type="button"
        onClick={() => onSelect(icon)}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`查看 ${icon.name}`}
      />
      <div className={cn('shrink-0', dark && 'rounded-lg bg-neutral-900')}>
        <SmartImage
          src={src}
          alt=""
          eager={eager}
          className="pointer-events-none size-12 sm:size-14"
          imgClassName="object-contain"
          width={PREVIEW_SIZE}
          height={PREVIEW_SIZE}
          fallback={<span className="text-[10px] text-muted-foreground">加载失败</span>}
        />
      </div>
      <span className="pointer-events-none line-clamp-1 w-full text-center text-[11px] leading-4 text-muted-foreground transition-colors group-hover:text-foreground">
        {icon.name}
      </span>

      <div className="absolute right-1 top-1 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={download}
          title="下载 PNG（240）"
          aria-label="下载 PNG"
          className="grid size-6 place-items-center rounded-md border border-border/70 bg-card text-muted-foreground shadow-card transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {action === 'download' ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Download className="size-3" />
          )}
        </button>
        <button
          type="button"
          onClick={copy}
          title={copied ? '已复制链接' : '复制 PNG 链接'}
          aria-label={copied ? '已复制链接' : '复制 PNG 链接'}
          className={cn(
            'grid size-6 place-items-center rounded-md border border-border/70 bg-card text-muted-foreground shadow-card transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            copied && 'text-brand',
          )}
        >
          {action === 'copy' ? (
            <Loader2 className="size-3 animate-spin" />
          ) : copied ? (
            <Check className="size-3" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
      </div>
    </div>
  )
})
