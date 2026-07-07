'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface Location {
  id: string
  name: string
}

interface Variant {
  id: string
  sku: string | null
  name: string | null
  product: {
    name: string
  }
}

interface Adjustment {
  id: string
  locationId: string | null
  variantId: string
  quantity: number
  reason: string
  notes: string | null
  createdAt: Date
  location: Location | null
  variant: Variant
}

interface InventoryAdjustmentManagerProps {
  locations: Location[]
  variants: Variant[]
  adjustments: Adjustment[]
}

export default function InventoryAdjustmentManager({
  locations,
  variants,
  adjustments: initialAdjustments,
}: InventoryAdjustmentManagerProps) {
  const [adjustments, setAdjustments] = useState(initialAdjustments)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    locationId: '',
    variantId: '',
    quantity: '',
    reason: 'manual',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/admin/inventory/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          locationId: formData.locationId || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create adjustment')
      }

      const { adjustment } = await response.json()
      setAdjustments([adjustment, ...adjustments])
      setFormData({
        locationId: '',
        variantId: '',
        quantity: '',
        reason: 'manual',
        notes: '',
      })
      setShowForm(false)
      window.location.reload()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Adjustments ({adjustments.length})</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Adjustment'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="locationId">Location (optional)</Label>
                  <Select
                    id="locationId"
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  >
                    <option value="">Global Inventory</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="variantId">Variant ID *</Label>
                  <Input
                    id="variantId"
                    value={formData.variantId}
                    onChange={(e) => setFormData({ ...formData, variantId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity Change *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Positive to add, negative to remove"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <Select
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  >
                    <option value="manual">Manual Adjustment</option>
                    <option value="damaged">Damaged</option>
                    <option value="returned">Returned</option>
                    <option value="found">Found</option>
                    <option value="cycle_count">Cycle Count</option>
                    <option value="theft">Theft</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adjusting...' : 'Create Adjustment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {adjustments.map((adjustment) => (
          <Card key={adjustment.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">
                    {adjustment.variant.product.name} {adjustment.variant.name && `- ${adjustment.variant.name}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Location: {adjustment.location?.name || 'Global'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: <span className={adjustment.quantity >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {adjustment.quantity >= 0 ? '+' : ''}{adjustment.quantity}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">Reason: {adjustment.reason}</p>
                  {adjustment.notes && <p className="text-sm text-gray-600">Notes: {adjustment.notes}</p>}
                  <p className="text-xs text-gray-500">
                    {new Date(adjustment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


