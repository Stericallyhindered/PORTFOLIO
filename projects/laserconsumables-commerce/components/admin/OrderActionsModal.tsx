'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'

interface OrderActionsModalProps {
  order: any
  onClose: () => void
  onSuccess: () => void
}

export default function OrderActionsModal({ order, onClose, onSuccess }: OrderActionsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [action, setAction] = useState<'hold' | 'restore' | 'markShipped' | 'addTag' | 'assignUser'>('hold')
  const [formData, setFormData] = useState({
    holdUntilDate: '',
    carrierCode: '',
    shipDate: new Date().toISOString().split('T')[0],
    trackingNumber: '',
    notifyCustomer: false,
    tagId: '',
    userId: '',
  })

  const handleAction = async () => {
    setLoading(true)
    setError('')
    try {
      let response
      switch (action) {
        case 'hold':
          if (!formData.holdUntilDate) {
            setError('Hold until date is required')
            return
          }
          response = await fetch('/api/admin/shipstation/orders/hold', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.orderId || order.id,
              holdUntilDate: formData.holdUntilDate,
            }),
          })
          break

        case 'restore':
          response = await fetch('/api/admin/shipstation/orders/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.orderId || order.id,
            }),
          })
          break

        case 'markShipped':
          if (!formData.carrierCode) {
            setError('Carrier code is required')
            return
          }
          response = await fetch('/api/admin/shipstation/orders/mark-shipped', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.orderId || order.id,
              carrierCode: formData.carrierCode,
              shipDate: formData.shipDate,
              trackingNumber: formData.trackingNumber,
              notifyCustomer: formData.notifyCustomer,
            }),
          })
          break

        case 'addTag':
          if (!formData.tagId) {
            setError('Tag ID is required')
            return
          }
          response = await fetch('/api/admin/shipstation/orders/add-tag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.orderId || order.id,
              tagId: parseInt(formData.tagId),
            }),
          })
          break

        case 'assignUser':
          if (!formData.userId) {
            setError('User ID is required')
            return
          }
          response = await fetch('/api/admin/shipstation/orders/assign-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderIds: [order.orderId || order.id],
              userId: formData.userId,
            }),
          })
          break
      }

      if (!response?.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Action failed')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Actions</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
          )}

          <div>
            <Label>Action</Label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={action}
              onChange={(e) => setAction(e.target.value as any)}
            >
              <option value="hold">Hold Until Date</option>
              <option value="restore">Restore From Hold</option>
              <option value="markShipped">Mark as Shipped</option>
              <option value="addTag">Add Tag</option>
              <option value="assignUser">Assign User</option>
            </select>
          </div>

          {action === 'hold' && (
            <div>
              <Label>Hold Until Date *</Label>
              <Input
                type="date"
                value={formData.holdUntilDate}
                onChange={(e) => setFormData({ ...formData, holdUntilDate: e.target.value })}
                required
              />
            </div>
          )}

          {action === 'markShipped' && (
            <>
              <div>
                <Label>Carrier Code *</Label>
                <Input
                  value={formData.carrierCode}
                  onChange={(e) => setFormData({ ...formData, carrierCode: e.target.value })}
                  placeholder="usps, fedex, ups"
                  required
                />
              </div>
              <div>
                <Label>Ship Date</Label>
                <Input
                  type="date"
                  value={formData.shipDate}
                  onChange={(e) => setFormData({ ...formData, shipDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Tracking Number</Label>
                <Input
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.notifyCustomer}
                  onChange={(e) => setFormData({ ...formData, notifyCustomer: e.target.checked })}
                />
                <Label>Notify Customer</Label>
              </div>
            </>
          )}

          {action === 'addTag' && (
            <div>
              <Label>Tag ID *</Label>
              <Input
                type="number"
                value={formData.tagId}
                onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                required
              />
            </div>
          )}

          {action === 'assignUser' && (
            <div>
              <Label>User ID *</Label>
              <Input
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleAction} disabled={loading}>
              {loading ? 'Processing...' : 'Execute'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


