'use client'

import { ShippingMethod } from '@/lib/shipping/carrier-rates'
import { formatCurrency } from '@/lib/utils'
import { ShippingMethodBadge } from './ShippingMethodBadge'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { calculateDeliveryDates } from '@/lib/shipping/delivery-dates'

interface ShippingMethodCardProps {
  method: ShippingMethod
  selected?: boolean
  onSelect?: (method: ShippingMethod) => void
  hasBackOrderItems?: boolean
  hasPreOrderItems?: boolean
}

export function ShippingMethodCard({
  method,
  selected,
  onSelect,
  hasBackOrderItems,
  hasPreOrderItems,
}: ShippingMethodCardProps) {
  // Add 25 days to delivery time for back-ordered items
  const getAdjustedDeliveryInfo = () => {
    if (!method.deliveryDays) return { days: null, dateRange: method.estimatedDays || null }
    if (!hasBackOrderItems && !hasPreOrderItems) {
      const { formatted } = calculateDeliveryDates(method.deliveryDays)
      return { days: method.deliveryDays, dateRange: formatted }
    }

    // Add 25 days to the delivery time for back-ordered items
    const adjustedDays = hasBackOrderItems ? method.deliveryDays + 25 : method.deliveryDays
    const { formatted: dateRange } = calculateDeliveryDates(adjustedDays)

    return { days: adjustedDays, dateRange }
  }

  const { days: adjustedDeliveryDays, dateRange } = getAdjustedDeliveryInfo()

  return (
    <div
      className={cn(
        'relative flex flex-col p-4 rounded-lg border transition-colors cursor-pointer',
        selected
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
          : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700',
      )}
      onClick={() => onSelect?.(method)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{method.name}</h3>
            {method.badges?.map((badge) => (
              <ShippingMethodBadge
                key={badge.type}
                type={badge.type}
                label={badge.label}
                color={badge.color}
              />
            ))}
          </div>
          <div className="mt-2 space-y-1">
            {hasPreOrderItems ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Your order contains pre-order items. These items will ship on their release date.
                </AlertDescription>
              </Alert>
            ) : hasBackOrderItems ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Delivery by {dateRange} (includes back-order processing)
                </p>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Your order contains back-ordered items. Please allow 3-4 weeks for delivery.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              adjustedDeliveryDays && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {method.guaranteedDelivery ? 'Guaranteed delivery by ' : 'Delivery by '}
                  {dateRange}
                </p>
              )
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{formatCurrency(method.price)}</p>
          {method.totalWithTax && method.totalWithTax > method.price && (
            <p className="text-sm text-gray-500">{formatCurrency(method.totalWithTax)} with tax</p>
          )}
        </div>
      </div>
    </div>
  )
}
