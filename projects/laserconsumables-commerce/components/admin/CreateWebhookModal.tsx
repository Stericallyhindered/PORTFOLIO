'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'

interface CreateWebhookModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateWebhookModal({ onClose, onSuccess }: CreateWebhookModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    target_url: '',
    event: 'ORDER_NOTIFY',
    store_id: '',
    friendly_name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/shipstation/webhooks/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_url: formData.target_url,
          event: formData.event,
          store_id: formData.store_id ? parseInt(formData.store_id) : undefined,
          friendly_name: formData.friendly_name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to subscribe webhook')
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
          <CardTitle>Subscribe Webhook</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
            )}

            <div>
              <Label>Target URL *</Label>
              <Input
                type="url"
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                placeholder="https://example.com/webhook"
                required
              />
            </div>

            <div>
              <Label>Event Type *</Label>
              <Select
                value={formData.event}
                onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                required
              >
                <option value="ORDER_NOTIFY">Order Notify</option>
                <option value="ITEM_ORDER_NOTIFY">Item Order Notify</option>
                <option value="SHIP_NOTIFY">Ship Notify</option>
                <option value="ITEM_SHIP_NOTIFY">Item Ship Notify</option>
                <option value="FULFILLMENT_SHIPPED">Fulfillment Shipped</option>
                <option value="FULFILLMENT_REJECTED">Fulfillment Rejected</option>
              </Select>
            </div>

            <div>
              <Label>Store ID (optional)</Label>
              <Input
                type="number"
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                placeholder="Leave empty for all stores"
              />
            </div>

            <div>
              <Label>Friendly Name (optional)</Label>
              <Input
                value={formData.friendly_name}
                onChange={(e) => setFormData({ ...formData, friendly_name: e.target.value })}
                placeholder="My Webhook"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


