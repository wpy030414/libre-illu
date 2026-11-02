import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { FilterPanel, type FilterGroup } from '@/components/results/filter-panel'

interface FilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: FilterGroup[]
  resultCount: number
}

/** 移动端筛选抽屉：复用桌面筛选面板，底部显示结果数并关闭。 */
export function FilterDrawer({ open, onOpenChange, groups, resultCount }: FilterDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="筛选" description="按风格与分类缩小范围" side="bottom">
        <FilterPanel groups={groups} className="pb-2" />
        <div className="-mx-5 mt-4 border-t border-border/80 bg-card px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <Button className="w-full rounded-xl" onClick={() => onOpenChange(false)}>
            查看 {resultCount.toLocaleString()} 个结果
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
