'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface InventoryManagerProps {
  variant: {
    id: string
    inventoryQuantity: number
    lowStockThreshold: number
    backorderEnabled: boolean
    backorderMessage: string | null
    inventoryPolicy: string
    trackInventory: boolean
  }
}

export default function InventoryManager({ variant }: InventoryManagerProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    inventoryQuantity: variant.inventoryQuantity,
    lowStockThreshold: variant.lowStockThreshold,
    backorderEnabled: variant.backorderEnabled,
    backorderMessage: variant.backorderMessage || '',
    inventoryPolicy: variant.inventoryPolicy,
    trackInventory: variant.trackInventory,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: variant.id,
          ...formData,
        }),
      })

      if (response.ok) {
        alert('Inventory updated successfully')
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update inventory')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Management</CardTitle>
        <CardDescription>Control stock levels and backorder settings</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trackInventory">Track Inventory</Label>
            <select
              id="trackInventory"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.trackInventory ? 'true' : 'false'}
              onChange={(e) =>
                setFormData({ ...formData, trackInventory: e.target.value === 'true' })
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {formData.trackInventory && (
            <>
              <div className="space-y-2">
                <Label htmlFor="inventoryQuantity">Current Quantity</Label>
                <Input
                  id="inventoryQuantity"
                  type="number"
                  min="0"
                  value={formData.inventoryQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inventoryQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lowStockThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Alert when stock falls below this number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventoryPolicy">Inventory Policy</Label>
                <select
                  id="inventoryPolicy"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.inventoryPolicy}
                  onChange={(e) =>
                    setFormData({ ...formData, inventoryPolicy: e.target.value })
                  }
                >
                  <option value="deny">Deny (Don&apos;t allow purchase when out of stock)</option>
                  <option value="continue">Continue (Allow purchase, don&apos;t track)</option>
                  <option value="backorder">Backorder (Allow purchase, show backorder message)</option>
                </select>
              </div>

              {formData.inventoryPolicy === 'backorder' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="backorderEnabled">Enable Backorders</Label>
                    <select
                      id="backorderEnabled"
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.backorderEnabled ? 'true' : 'false'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          backorderEnabled: e.target.value === 'true',
                        })
                      }
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  {formData.backorderEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="backorderMessage">Backorder Message</Label>
                      <Input
                        id="backorderMessage"
                        value={formData.backorderMessage}
                        onChange={(e) =>
                          setFormData({ ...formData, backorderMessage: e.target.value })
                        }
                        placeholder="e.g., Available on backorder - ships in 2-3 weeks"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Inventory Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}




