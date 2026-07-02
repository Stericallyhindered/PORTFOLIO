'use client'

import { cn } from '@/lib/utils'

type BadgeType = 'best-value' | 'fastest' | 'recommended' | 'economy'

interface BadgeProps {
  type: BadgeType
  label: string
  color: string
}

const badgeStyles: Record<BadgeType, string> = {
  'best-value': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  fastest: 'bg-blue-100 text-blue-800 border-blue-200',
  recommended: 'bg-purple-100 text-purple-800 border-purple-200',
  economy: 'bg-gray-100 text-gray-800 border-gray-200',
}

export function ShippingMethodBadge({ type, label }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        badgeStyles[type],
      )}
    >
      {label}
    </span>
  )
}
