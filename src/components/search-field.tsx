import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  /** 清空输入（是否同时回到首页由调用方决定） */
  onClear?: () => void
  variant?: 'hero' | 'toolbar'
  placeholder?: string
  ariaLabel?: string
  busy?: boolean
  autoFocus?: boolean
  className?: string
}

/**
 * 共享搜索框：首页大号与结果页紧凑两种尺寸。
 * 中文输入法组合期间不触发提交；按 `/` 可从页面任意位置聚焦。
 */
export function SearchField({
  value,
  onChange,
  onSubmit,
  onClear,
  variant = 'toolbar',
  placeholder,
  ariaLabel,
  busy = false,
  autoFocus = false,
  className,
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const composing = useRef(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      event.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (composing.current) return
    onSubmit(value.trim())
  }

  const hero = variant === 'hero'

  return (
    <form
      role="search"
      onSubmit={submit}
      className={cn('relative w-full', className)}
      onClick={() => inputRef.current?.focus()}
    >
      <Search
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground',
          hero ? 'left-5 size-5' : 'left-3.5 size-4',
        )}
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onCompositionStart={() => {
          composing.current = true
        }}
        onCompositionEnd={() => {
          composing.current = false
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        enterKeyHint="search"
        className={cn(
          'border-border bg-card shadow-card transition-shadow placeholder:text-muted-foreground/80 focus-visible:ring-0',
          hero
            ? 'h-14 rounded-2xl pl-14 pr-28 text-base shadow-float focus:border-brand'
            : 'h-11 rounded-xl pl-10 pr-9 text-sm',
          focused && 'border-brand/60',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            onClear?.()
            inputRef.current?.focus()
          }}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            hero ? 'right-[6.5rem]' : 'right-2',
          )}
          aria-label="清空搜索"
        >
          <X className={hero ? 'size-5' : 'size-4'} />
        </button>
      )}
      {hero && (
        <Button
          type="submit"
          disabled={busy}
          className="absolute right-2 top-1/2 h-11 -translate-y-1/2 rounded-xl px-5 text-sm shadow-none"
        >
          {busy ? '搜索中…' : '搜索'}
        </Button>
      )}
    </form>
  )
}
