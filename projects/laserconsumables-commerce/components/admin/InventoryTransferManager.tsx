'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'

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

interface Transfer {
  id: string
  fromLocationId: string
  toLocationId: string
  variantId: string
  quantity: number
  status: string
  notes: string | null
  createdAt: Date
  fromLocation: Location
  toLocation: Location
  variant: Variant
}

interface InventoryTransferManagerProps {
  locations: Location[]
  transfers: Transfer[]
}

export default function InventoryTransferManager({
  locations,
  transfers: initialTransfers,
}: InventoryTransferManagerProps) {
  const [transfers, setTransfers] = useState(initialTransfers)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fromLocationId: '',
    toLocationId: '',
    variantId: '',
    quantity: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/admin/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create transfer')
      }

      const { transfer } = await response.json()
      setTransfers([transfer, ...transfers])
      setFormData({
        fromLocationId: '',
        toLocationId: '',
        variantId: '',
        quantity: '',
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
        <h3 className="text-lg font-semibold">Recent Transfers ({transfers.length})</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Transfer'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromLocationId">From Location *</Label>
                  <Select
                    id="fromLocationId"
                    value={formData.fromLocationId}
                    onChange={(e) => setFormData({ ...formData, fromLocationId: e.target.value })}
                    required
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="toLocationId">To Location *</Label>
                  <Select
                    id="toLocationId"
                    value={formData.toLocationId}
                    onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
                    required
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="variantId">Product Variant *</Label>
                  <Input
                    id="variantId"
                    value={formData.variantId}
                    onChange={(e) => setFormData({ ...formData, variantId: e.target.value })}
                    placeholder="Variant ID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="1"
                  />
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
                {loading ? 'Transferring...' : 'Create Transfer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {transfers.map((transfer) => (
          <Card key={transfer.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">
                    {transfer.variant.product.name} {transfer.variant.name && `- ${transfer.variant.name}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {transfer.fromLocation.name} → {transfer.toLocation.name}
                  </p>
                  <p className="text-sm text-gray-600">Quantity: {transfer.quantity}</p>
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-semibold">{transfer.status}</span>
                  </p>
                  {transfer.notes && <p className="text-sm text-gray-600">Notes: {transfer.notes}</p>}
                  <p className="text-xs text-gray-500">
                    {new Date(transfer.createdAt).toLocaleString()}
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


