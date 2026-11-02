import { useMemo, useState } from 'react'
import { Download, Palette, ShieldCheck } from 'lucide-react'
import { SearchField } from '@/components/search-field'
import { StyleCard } from '@/components/home/style-card'
import { ThemeCard } from '@/components/home/theme-card'
import { useLandingThemes } from '@/hooks/use-landing-themes'
import type { IllustrationStyle } from '@/lib/illustration-styles'
import type { StyleMeta } from '@/lib/styles-catalog'
import type { Mode } from '@/lib/types'

const COPY: Record<
  Mode,
  {
    title: string
    /** 标题里用主题色强调的词 */
    highlight: string
    subtitle: string
    placeholder: string
    sectionTitle: string
    sectionHint: string
  }
> = {
  icons: {
    title: '把对的图标，\n送到对的界面里',
    highlight: '图标',
    subtitle: '九十余种设计风格、八十余万个图标。',
    placeholder: '搜索图标，如 home / 日历 / calendar',
    sectionTitle: '按风格浏览',
    sectionHint: '每种风格都有成套的图标，混搭也不会跑偏。',
  },
  illustrations: {
    title: '让插图，\n替你把话说完',
    highlight: '插图',
    subtitle: '数百种插画风格，人物、场景、教育、商务一应俱全。',
    placeholder: '搜索插图，如 cat / office / team',
    sectionTitle: '热门主题',
    sectionHint: '从常见场景开始逛，也可以直接搜索英文关键词。',
  },
}

/** 把标题里的关键词染成当前主题色。 */
function HeroTitle({ text, highlight }: { text: string; highlight: string }) {
  const index = text.indexOf(highlight)
  if (index < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <span className="text-brand-text">{highlight}</span>
      {text.slice(index + highlight.length)}
    </>
  )
}

const VALUE_PROPS = [
  { icon: ShieldCheck, title: '无需账户', text: '打开就能搜，不用登录、不弹付费窗。' },
  { icon: Download, title: '一键下载', text: '悬停即见下载与复制，选好尺寸直接带走。' },
  { icon: Palette, title: '成套风格', text: '同一套风格里的图标彼此协调，混搭也稳。' },
]

interface LandingViewProps {
  mode: Mode
  iconStyles: StyleMeta[]
  iconStylesLoading: boolean
  illustrationStyles: IllustrationStyle[]
  illustrationStylesLoading: boolean
  onSearch: (term: string) => void
  onSelectStyle: (slug: string) => void
}

/** 首页落地页：Hero + 可浏览的风格/主题墙，让空状态也有内容可逛。 */
export function LandingView({
  mode,
  iconStyles,
  iconStylesLoading,
  illustrationStyles,
  illustrationStylesLoading,
  onSearch,
  onSelectStyle,
}: LandingViewProps) {
  const [draft, setDraft] = useState('')
  const [showAll, setShowAll] = useState(false)
  const copy = COPY[mode]
  const { themes, loading: themesLoading } = useLandingThemes(mode === 'illustrations')

  const sortedIcons = useMemo(
    () => [...iconStyles].sort((a, b) => b.quantity - a.quantity),
    [iconStyles],
  )
  const topIcons = showAll ? sortedIcons : sortedIcons.slice(0, 12)

  const collage = useMemo(() => {
    if (mode === 'icons') {
      const withPreview = sortedIcons.filter((style) => Boolean(style.previewUrl))
      const colorful = withPreview.filter((style) => /color/i.test(style.apiCode))
      const picked = [...colorful, ...withPreview].filter(
        (style, index, list) => list.findIndex((item) => item.apiCode === style.apiCode) === index,
      )
      return picked.slice(0, 3).map((style) => style.previewUrl) as string[]
    }
    return illustrationStyles
      .map((style) => style.thumb)
      .filter((url): url is string => Boolean(url))
      .slice(0, 3)
  }, [mode, sortedIcons, illustrationStyles])

  const loading = mode === 'icons' ? iconStylesLoading : illustrationStylesLoading

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 px-4 pb-14 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20 lg:pt-24">
          <div className="min-w-0">
            <h1 className="whitespace-pre-line text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              <HeroTitle text={copy.title} highlight={copy.highlight} />
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              {copy.subtitle}
            </p>

            <div className="mt-7 max-w-xl">
              <SearchField
                value={draft}
                onChange={setDraft}
                onSubmit={(value) => {
                  if (value) onSearch(value)
                }}
                variant="hero"
                placeholder={copy.placeholder}
                ariaLabel={mode === 'icons' ? '搜索图标' : '搜索插图'}
              />
            </div>
          </div>

          <div className="relative hidden h-[360px] lg:block" aria-hidden="true">
            <div className="absolute inset-x-8 top-10 h-64 rounded-[2rem] bg-brand-soft/70 blur-2xl" />
            {loading || collage.length === 0
              ? [0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="absolute h-[210px] w-48 animate-pulse rounded-2xl border border-border/60 bg-card shadow-float"
                    style={{
                      left: `${index * 26 + 4}%`,
                      top: `${index === 1 ? 8 : index === 0 ? 44 : 96}px`,
                      transform: `rotate(${index === 1 ? 3 : index === 0 ? -5 : -2}deg)`,
                    }}
                  />
                ))
              : collage.map((src, index) => (
                  <div
                    key={src}
                    className="absolute w-48 overflow-hidden rounded-2xl border border-border/70 bg-card p-2 shadow-float transition-transform duration-500 hover:-translate-y-1"
                    style={{
                      left: `${index * 26 + 4}%`,
                      top: `${index === 1 ? 8 : index === 0 ? 44 : 96}px`,
                      transform: `rotate(${index === 1 ? 3 : index === 0 ? -5 : -2}deg)`,
                      zIndex: index === 1 ? 2 : 1,
                    }}
                  >
                    <img
                      src={src}
                      alt=""
                      className="aspect-[4/3] w-full rounded-xl object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-4 pb-4 sm:px-6">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{copy.sectionTitle}</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{copy.sectionHint}</p>
          </div>
          {mode === 'icons' && sortedIcons.length > 12 && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="text-xs font-medium text-brand transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showAll ? '收起' : `展开全部 ${sortedIcons.length} 种风格`}
            </button>
          )}
        </div>

        {mode === 'icons' ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {topIcons.map((style) => (
              <StyleCard
                key={style.apiCode}
                title={style.title}
                count={style.quantity}
                image={style.previewUrl}
                onClick={() => onSelectStyle(style.apiCode)}
              />
            ))}
            {iconStylesLoading &&
              Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="aspect-[4/3] animate-pulse rounded-xl border border-border/60 bg-muted"
                />
              ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {themesLoading
              ? Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] animate-pulse rounded-xl border border-border/60 bg-muted"
                  />
                ))
              : themes.map((theme) => (
                  <ThemeCard
                    key={theme.term}
                    term={theme.term}
                    label={theme.label}
                    images={theme.images}
                    onClick={() => onSearch(theme.term)}
                  />
                ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6">
        <div className="grid gap-5 rounded-2xl border border-border/70 bg-card p-5 sm:grid-cols-3 sm:p-6">
          {VALUE_PROPS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
