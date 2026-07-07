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

interface Stocktaking {
  id: string
  locationId: string | null
  status: string
  startedAt: Date | null
  completedAt: Date | null
  notes: string | null
  createdAt: Date
  location: Location | null
  items: Array<{
    id: string
    variantId: string
    expectedQty: number
    countedQty: number
    variance: number
    notes: string | null
    variant: {
      id: string
      sku: string | null
      name: string | null
      product: {
        name: string
      }
    }
  }>
}

interface StocktakingManagerProps {
  locations: Location[]
  stocktakings: Stocktaking[]
}

export default function StocktakingManager({
  locations,
  stocktakings: initialStocktakings,
}: StocktakingManagerProps) {
  const [stocktakings, setStocktakings] = useState(initialStocktakings)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    locationId: '',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/admin/inventory/stocktaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          locationId: formData.locationId || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create stocktaking')
      }

      const { stocktaking } = await response.json()
      setStocktakings([stocktaking, ...stocktakings])
      setFormData({ locationId: '' })
      setShowForm(false)
      window.location.reload()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id: string, applyAdjustments: boolean) => {
    try {
      const response = await fetch('/api/admin/inventory/stocktaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          stocktakingId: id,
          applyAdjustments,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete stocktaking')
      }

      window.location.reload()
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Stocktaking Sessions ({stocktakings.length})</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Stocktaking'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
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
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Stocktaking Session'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {stocktakings.map((stocktaking) => (
          <Card key={stocktaking.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">
                    Stocktaking #{stocktaking.id.slice(0, 8)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Location: {stocktaking.location?.name || 'Global'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-semibold">{stocktaking.status}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Items: {stocktaking.items.length}
                  </p>
                  {stocktaking.items.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold">Variances:</p>
                      {stocktaking.items
                        .filter((item) => item.variance !== 0)
                        .map((item) => (
                          <p key={item.id} className="text-sm text-gray-600">
                            {item.variant.product.name}: Expected {item.expectedQty}, Counted {item.countedQty} (
                            {item.variance >= 0 ? '+' : ''}{item.variance})
                          </p>
                        ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Created: {new Date(stocktaking.createdAt).toLocaleString()}
                  </p>
                </div>
                {stocktaking.status === 'IN_PROGRESS' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleComplete(stocktaking.id, false)}
                    >
                      Complete (No Adjustments)
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleComplete(stocktaking.id, true)}
                    >
                      Complete & Apply Adjustments
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


