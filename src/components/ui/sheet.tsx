import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** 从底部或左侧滑入，默认底部 */
  side?: 'bottom' | 'left'
  title: string
  description?: string
}

/** 移动端抽屉：基于 Radix Dialog 的焦点陷阱与 Esc 关闭。 */
export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, children, side = 'bottom', title, description, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 flex flex-col bg-card shadow-float focus:outline-none',
        side === 'bottom'
          ? 'inset-x-0 bottom-0 max-h-[88dvh] animate-slide-up rounded-t-2xl border-t'
          : 'inset-y-0 left-0 w-[84vw] max-w-sm animate-fade-in-up border-r',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
        <div>
          <DialogPrimitive.Title className="text-base font-semibold">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description
            className={cn('text-xs text-muted-foreground', !description && 'sr-only')}
          >
            {description ?? title}
          </DialogPrimitive.Description>
        </div>
        <DialogPrimitive.Close className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="size-4" />
          <span className="sr-only">关闭</span>
        </DialogPrimitive.Close>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
SheetContent.displayName = 'SheetContent'
