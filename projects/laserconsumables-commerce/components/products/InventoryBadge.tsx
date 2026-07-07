'use client'

import { InventoryStatus } from '@/lib/services/inventory'

interface InventoryBadgeProps {
  status: InventoryStatus
  showQuantity?: boolean
}

export default function InventoryBadge({
  status,
  showQuantity = true,
}: InventoryBadgeProps) {
  if (status.trackInventory === false && status.status === 'in_stock') {
    return null // Don't show badge if inventory tracking is disabled
  }

  const getBadgeStyles = () => {
    switch (status.status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'backorder':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = () => {
    switch (status.status) {
      case 'in_stock':
        return showQuantity ? `${status.quantity} in stock` : 'In Stock'
      case 'low_stock':
        return status.message || `Only ${status.quantity} left`
      case 'out_of_stock':
        return 'Out of Stock'
      case 'backorder':
        return status.message || 'Backorder'
      default:
        return ''
    }
  }

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getBadgeStyles()}`}
    >
      {getStatusText()}
    </div>
  )
}




