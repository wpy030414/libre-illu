import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type Phase = 'loading' | 'loaded' | 'error'

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string
  alt: string
  /** 首屏图片可以设为 eager，其余默认懒加载 */
  eager?: boolean
  /** 外层容器（控制尺寸与圆角） */
  className?: string
  /** img 自身（控制 object-fit、内边距、过渡） */
  imgClassName?: string
  /** 加载失败时的替代内容 */
  fallback?: ReactNode
}

/**
 * 带骨架与淡入的图片：加载中显示脉动占位，加载完成淡入，失败给出明确反馈。
 * 避免图标/插图 CDN 偶发变慢时出现无意义的空白块。
 */
export function SmartImage({
  src,
  alt,
  eager = false,
  className,
  imgClassName,
  fallback,
  ...rest
}: SmartImageProps) {
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    setPhase('loading')
  }, [src])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {phase === 'loading' && (
        <div
          className="absolute inset-0 animate-pulse rounded-[inherit] bg-muted"
          aria-hidden="true"
        />
      )}
      {phase === 'error' ? (
        <div className="grid size-full place-items-center text-muted-foreground">
          {fallback ?? (
            <span className="flex flex-col items-center gap-1 text-[10px]">
              <ImageOff className="size-4" aria-hidden="true" />
              加载失败
            </span>
          )}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setPhase('loaded')}
          onError={() => setPhase('error')}
          className={cn(
            'h-full w-full object-contain transition-opacity duration-300',
            phase === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
          {...rest}
        />
      )}
    </div>
  )
}
