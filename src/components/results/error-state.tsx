import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title: string
  message?: string | null
  onRetry?: () => void
  onHome?: () => void
}

export function ErrorState({ title, message, onRetry, onHome }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {message && <p className="mt-1 max-w-md text-xs text-muted-foreground">{message}</p>}
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <Button size="sm" onClick={onRetry}>
            重试
          </Button>
        )}
        {onHome && (
          <Button size="sm" variant="outline" onClick={onHome}>
            回到首页
          </Button>
        )}
      </div>
    </div>
  )
}
