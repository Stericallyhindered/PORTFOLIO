'use client'

import { Progress } from '@/components/ui/progress'

interface DiscountProgressProps {
  subtotal: number
  threshold: number
  percent: number
  label: string
  isCompact?: boolean
}

export function DiscountProgress({
  subtotal,
  threshold,
  percent,
  label,
  isCompact = false,
}: DiscountProgressProps) {
  const progress = Math.min((subtotal / threshold) * 100, 100)
  const remaining = Math.max(threshold - subtotal, 0)
  const hasUnlockedDiscount = subtotal >= threshold

  if (hasUnlockedDiscount) {
    return (
      <div className={`${isCompact ? 'text-sm' : ''} space-y-1 my-4`}>
        <span className="text-green-600 font-medium block">
          {percent}% {label} Applied
        </span>
      </div>
    )
  }

  return (
    <div className={`${isCompact ? 'text-sm' : ''} space-y-2 my-4`}>
      <div className="space-y-1">
        <span className="text-muted-foreground block">
          Add ${remaining.toFixed(2)} more to unlock &quot;{label}&quot;
        </span>
        <span className="text-muted-foreground text-right block text-sm">
          ${subtotal.toFixed(2)} / ${threshold.toFixed(2)}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
