'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Variant {
  id: string
  sku: string | null
  name: string | null
  inventoryQuantity: number
  lowStockThreshold: number
  product: {
    name: string
  }
}

interface BulkInventoryManagerProps {
  variants: Variant[]
}

export default function BulkInventoryManager({ variants }: BulkInventoryManagerProps) {
  const [loading, setLoading] = useState(false)
  const [updates, setUpdates] = useState<Record<string, { quantity?: number; threshold?: number }>>({})

  const handleBulkUpdate = async (field: 'quantity' | 'threshold', value: number) => {
    setLoading(true)
    try {
      const updatesToApply: any[] = []
      
      variants.forEach((variant) => {
        if (updates[variant.id]?.[field] !== undefined) {
          updatesToApply.push({
            variantId: variant.id,
            [field === 'quantity' ? 'inventoryQuantity' : 'lowStockThreshold']: updates[variant.id][field],
          })
        } else {
          updatesToApply.push({
            variantId: variant.id,
            [field === 'quantity' ? 'inventoryQuantity' : 'lowStockThreshold']: value,
          })
        }
      })

      const response = await fetch('/api/admin/inventory/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: updatesToApply }),
      })

      if (response.ok) {
        alert('Bulk update successful!')
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

  const updateVariant = (variantId: string, field: 'quantity' | 'threshold', value: number) => {
    setUpdates((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value,
      },
    }))
  }

  const saveIndividual = async (variantId: string) => {
    setLoading(true)
    try {
      const update = updates[variantId]
      if (!update) return

      const response = await fetch('/api/admin/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          inventoryQuantity: update.quantity ?? variants.find((v) => v.id === variantId)?.inventoryQuantity,
          lowStockThreshold: update.threshold ?? variants.find((v) => v.id === variantId)?.lowStockThreshold,
        }),
      })

      if (response.ok) {
        setUpdates((prev) => {
          const next = { ...prev }
          delete next[variantId]
          return next
        })
        alert('Updated successfully!')
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
          <CardDescription>Update multiple variants at once</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Set All Quantities To</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  id="bulkQuantity"
                  placeholder="Enter quantity"
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    const input = document.getElementById('bulkQuantity') as HTMLInputElement
                    const value = parseInt(input.value)
                    if (!isNaN(value)) {
                      handleBulkUpdate('quantity', value)
                    }
                  }}
                  disabled={loading}
                >
                  Apply
                </Button>
              </div>
            </div>
            <div>
              <Label>Set All Thresholds To</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  id="bulkThreshold"
                  placeholder="Enter threshold"
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    const input = document.getElementById('bulkThreshold') as HTMLInputElement
                    const value = parseInt(input.value)
                    if (!isNaN(value)) {
                      handleBulkUpdate('threshold', value)
                    }
                  }}
                  disabled={loading}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Individual Variants</CardTitle>
          <CardDescription>Update specific variants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Threshold</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.id} className="border-b">
                    <td className="p-2">{variant.product.name}</td>
                    <td className="p-2 text-sm text-gray-500">{variant.sku || 'N/A'}</td>
                    <td className="p-2">
                      <Input
                        type="number"
                        defaultValue={variant.inventoryQuantity}
                        onChange={(e) =>
                          updateVariant(variant.id, 'quantity', parseInt(e.target.value) || 0)
                        }
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        defaultValue={variant.lowStockThreshold}
                        onChange={(e) =>
                          updateVariant(variant.id, 'threshold', parseInt(e.target.value) || 0)
                        }
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        onClick={() => saveIndividual(variant.id)}
                        disabled={loading || !updates[variant.id]}
                      >
                        Save
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





