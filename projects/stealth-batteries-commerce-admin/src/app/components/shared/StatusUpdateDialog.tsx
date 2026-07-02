'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { updateOrderStatus } from '@/app/(customAdmin)/admin/orders/[orderId]/actions'

const ORDER_STATUSES = [
  'pre-order',
  'back-order',
  'pending',
  'processing',
  'completed',
  'cancelled',
  'refunded',
] as const
type OrderStatus = (typeof ORDER_STATUSES)[number]

interface StatusUpdateDialogProps {
  orderId: string | number
  orderNumber: string | number
  currentStatus: OrderStatus
  trigger?: React.ReactNode
  onStatusUpdated?: () => void
}

export function StatusUpdateDialog({
  orderId,
  orderNumber,
  currentStatus,
  trigger,
  onStatusUpdated,
}: StatusUpdateDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleStatusUpdate = async () => {
    try {
      setIsUpdating(true)
      // Get the token from cookies
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('payload-token='))
        ?.split('=')[1]

      await updateOrderStatus(orderId.toString(), selectedStatus, token)
      toast.success('Order status updated successfully')

      // Call the callback if provided
      if (onStatusUpdated) {
        onStatusUpdated()
      } else {
        // If no callback provided, refresh the page
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update order status')
    } finally {
      setIsUpdating(false)
      setIsDialogOpen(false)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Update Status</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>Select a new status for order #{orderNumber}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleStatusUpdate}
            disabled={isUpdating || selectedStatus === currentStatus}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
