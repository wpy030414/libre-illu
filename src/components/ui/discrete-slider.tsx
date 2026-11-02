import { useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

interface DiscreteSliderProps {
  /** 离散档位，升序；滑轨等距排布（档位语义，而非数值比例） */
  values: readonly number[]
  /** 当前档位值 */
  value: number
  onChange: (value: number) => void
  /** 档位文案，用于刻度标签与 aria-valuetext */
  format?: (value: number) => string
  /** 无障碍名称 */
  label: string
  className?: string
}

/**
 * 离散滑轨：轨道 + 刻度点 + 可拖拽滑块 + 等距刻度标签。
 * 支持点击/拖动吸附最近档，键盘 ←/→/Home/End 切档。
 */
export function DiscreteSlider({
  values,
  value,
  onChange,
  format = (v) => String(v),
  label,
  className,
}: DiscreteSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const index = Math.max(
    0,
    values.indexOf(value) === -1 ? values.length - 1 : values.indexOf(value),
  )
  const pct = (i: number) => (values.length > 1 ? (i / (values.length - 1)) * 100 : 0)

  const snapFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const next = Math.round(ratio * (values.length - 1))
      if (next !== index) onChange(values[next])
    },
    [index, onChange, values],
  )

  const onKeyDown = (event: React.KeyboardEvent) => {
    let next = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = index + 1
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = values.length - 1
    else return
    event.preventDefault()
    event.stopPropagation()
    if (next >= 0 && next < values.length && next !== index) onChange(values[next])
  }

  return (
    <div className={cn('select-none', className)}>
      <div
        ref={trackRef}
        className="relative mx-1.5 h-5 touch-none"
        onPointerDown={(event) => {
          // 按下即捕获，后续 move/up 都落到轨道上，拖出轨道也能继续吸附
          event.currentTarget.setPointerCapture(event.pointerId)
          snapFromPointer(event.clientX)
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            snapFromPointer(event.clientX)
          }
        }}
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-brand transition-[width] duration-150"
          style={{ width: `${pct(index)}%` }}
        />
        {values.map((v, i) => (
          <span
            key={v}
            className={cn(
              'absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors',
              i <= index ? 'bg-brand' : 'bg-muted-foreground/40',
            )}
            style={{ left: `${pct(i)}%` }}
          />
        ))}
        <div
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={values[0]}
          aria-valuemax={values[values.length - 1]}
          aria-valuenow={values[index]}
          aria-valuetext={format(values[index])}
          onKeyDown={onKeyDown}
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-brand bg-background shadow-sm transition-[left] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:cursor-grabbing"
          style={{ left: `${pct(index)}%` }}
        />
      </div>
      <div className="relative mx-1.5 mt-1 h-4">
        {values.map((v, i) => (
          <span
            key={v}
            className={cn(
              // 中间标签锚定刻度点居中；首末档贴齐轨道两端靠内，避免溢出容器
              'absolute top-0 text-[10px] whitespace-nowrap tabular transition-colors',
              i === 0 && 'left-0',
              i === values.length - 1 && 'right-0',
              i > 0 && i < values.length - 1 && '-translate-x-1/2',
              i === index ? 'font-medium text-brand' : 'text-muted-foreground',
            )}
            style={i === 0 || i === values.length - 1 ? undefined : { left: `${pct(i)}%` }}
          >
            {format(v)}
          </span>
        ))}
      </div>
    </div>
  )
}
