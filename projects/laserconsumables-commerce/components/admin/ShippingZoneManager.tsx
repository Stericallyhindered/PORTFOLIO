'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

interface ShippingZone {
  id: string
  name: string
  countries: string[]
  states?: string[]
  zipCodes?: string[]
  rateRules: Array<{
    type: 'weight' | 'price' | 'item_count'
    min: number
    max?: number
    rate: number
    freeShipping?: boolean
  }>
}

interface ShippingProfile {
  id: string
  name: string
  zoneId: string
}

interface ShippingZoneManagerProps {
  zones: ShippingZone[]
  profiles: ShippingProfile[]
}

export default function ShippingZoneManager({ zones: initialZones, profiles }: ShippingZoneManagerProps) {
  const [zones, setZones] = useState(initialZones)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    countries: ['US'],
    states: [] as string[],
    zipCodes: [] as string[],
    rateRules: [] as ShippingZone['rateRules'],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/admin/shipping/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create zone')
      }

      const { zone } = await response.json()
      setZones([...zones, zone])
      setFormData({
        name: '',
        countries: ['US'],
        states: [],
        zipCodes: [],
        rateRules: [],
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
        <h3 className="text-lg font-semibold">Shipping Zones ({zones.length})</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Zone'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Zone Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="countries">Countries (comma-separated) *</Label>
                <Input
                  id="countries"
                  value={formData.countries.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      countries: e.target.value.split(',').map((c) => c.trim()),
                    })
                  }
                  placeholder="US, CA, MX"
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Zone'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {zones.map((zone) => (
          <Card key={zone.id}>
            <CardContent className="pt-6">
              <div>
                <h4 className="font-semibold">{zone.name}</h4>
                <p className="text-sm text-gray-600">Countries: {zone.countries.join(', ')}</p>
                {zone.states && zone.states.length > 0 && (
                  <p className="text-sm text-gray-600">States: {zone.states.join(', ')}</p>
                )}
                {zone.rateRules && zone.rateRules.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Rate Rules:</p>
                    {zone.rateRules.map((rule, idx) => (
                      <p key={idx} className="text-sm text-gray-600">
                        {rule.type}: {rule.min}
                        {rule.max ? ` - ${rule.max}` : '+'} →{' '}
                        {rule.freeShipping ? 'Free Shipping' : `$${rule.rate}`}
                      </p>
                    ))}
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


