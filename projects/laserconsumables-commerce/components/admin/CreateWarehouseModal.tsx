'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'

interface CreateWarehouseModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateWarehouseModal({ onClose, onSuccess }: CreateWarehouseModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    warehouseName: '',
    isDefault: false,
    originAddress: {
      name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      phone: '',
      residential: false,
    },
    returnAddress: {
      name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      phone: '',
      residential: false,
    },
    useOriginAsReturn: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/shipstation/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseName: formData.warehouseName,
          originAddress: formData.originAddress,
          returnAddress: formData.useOriginAsReturn ? undefined : formData.returnAddress,
          isDefault: formData.isDefault,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create warehouse')
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create Warehouse</CardTitle>
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
              <Label>Warehouse Name</Label>
              <Input
                value={formData.warehouseName}
                onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                placeholder="Main Warehouse"
              />
            </div>

            <div className="border rounded p-4 space-y-4">
              <h3 className="font-semibold">Origin Address *</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.originAddress.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      originAddress: { ...formData.originAddress, name: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input
                    value={formData.originAddress.company}
                    onChange={(e) => setFormData({
                      ...formData,
                      originAddress: { ...formData.originAddress, company: e.target.value }
                    })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Street Address *</Label>
                  <Input
                    value={formData.originAddress.street1}
                    onChange={(e) => setFormData({
                      ...formData,
                      originAddress: { ...formData.originAddress, street1: e.target.value }
                    })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Street Address 2</Label>
                  <Input
                    value={formData.originAddress.street2}
                    onChange={(e) => setFormData({
                      ...formData,
                      originAddress: { ...formData.originAddress, street2: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input
                    value={formData.originAddress.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      originAddress: { ...formData.originAddress, city: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label>State *</Label>
                  <Input
                    value={formData.originAddress.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      originAddress: { ...formData.originAddress, state: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label>ZIP Code *</Label>
                  <Input
                    value={formData.originAddress.postalCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      originAddress: { ...formData.originAddress, postalCode: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={formData.originAddress.country}
                    onChange={(e) => setFormData({
                      ...formData,
                      originAddress: { ...formData.originAddress, country: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.originAddress.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      originAddress: { ...formData.originAddress, phone: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.useOriginAsReturn}
                onChange={(e) => setFormData({ ...formData, useOriginAsReturn: e.target.checked })}
              />
              <Label>Use origin address as return address</Label>
            </div>

            {!formData.useOriginAsReturn && (
              <div className="border rounded p-4 space-y-4">
                <h3 className="font-semibold">Return Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.returnAddress.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        returnAddress: { ...formData.returnAddress, name: e.target.value }
                      })}
                      required={!formData.useOriginAsReturn}
                    />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input
                      value={formData.returnAddress.company}
                      onChange={(e) => setFormData({
                        ...formData,
                        returnAddress: { ...formData.returnAddress, company: e.target.value }
                      })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Street Address *</Label>
                    <Input
                      value={formData.returnAddress.street1}
                      onChange={(e) => setFormData({
                        ...formData,
                        returnAddress: { ...formData.returnAddress, street1: e.target.value }
                      })}
                      required={!formData.useOriginAsReturn}
                    />
                  </div>
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={formData.returnAddress.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        returnAddress: { ...formData.returnAddress, city: e.target.value }
                      })}
                      required={!formData.useOriginAsReturn}
                    />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input
                      value={formData.returnAddress.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        returnAddress: { ...formData.returnAddress, state: e.target.value }
                      })}
                      required={!formData.useOriginAsReturn}
                    />
                  </div>
                  <div>
                    <Label>ZIP Code *</Label>
                    <Input
                      value={formData.returnAddress.postalCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        returnAddress: { ...formData.returnAddress, postalCode: e.target.value }
                      })}
                      required={!formData.useOriginAsReturn}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              />
              <Label>Set as default warehouse</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Warehouse'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


