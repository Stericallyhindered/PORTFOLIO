'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface CreateLabelFormProps {
  order: any
  shipFrom: {
    name: string
    street1: string
    street2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  shipTo: {
    name: string
    street1: string
    street2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  defaultWeight: number
}

export default function CreateLabelForm({
  order,
  shipFrom,
  shipTo,
  defaultWeight,
}: CreateLabelFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [carriers, setCarriers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [rates, setRates] = useState<any[]>([])
  const [selectedCarrier, setSelectedCarrier] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedPackage, setSelectedPackage] = useState('package')
  const [weight, setWeight] = useState(defaultWeight.toFixed(2))
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: '',
  })
  const [shipDate, setShipDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    loadCarriers()
    loadPackages()
  }, [])

  useEffect(() => {
    if (selectedCarrier) {
      loadServices(selectedCarrier)
    }
  }, [selectedCarrier])

  const loadCarriers = async () => {
    try {
      const res = await fetch('/api/shipping/carriers')
      const data = await res.json()
      if (data.carriers) {
        setCarriers(data.carriers)
        if (data.carriers.length > 0) {
          setSelectedCarrier(data.carriers[0].code)
        }
      }
    } catch (err) {
      console.error('Failed to load carriers:', err)
    }
  }

  const loadServices = async (carrierCode: string) => {
    try {
      const res = await fetch(`/api/shipping/services?carrier=${carrierCode}`)
      const data = await res.json()
      if (data.services) {
        setServices(data.services)
      }
    } catch (err) {
      console.error('Failed to load services:', err)
    }
  }

  const loadPackages = async () => {
    try {
      const res = await fetch('/api/shipping/packages')
      const data = await res.json()
      if (data.packages) {
        setPackages(data.packages)
      }
    } catch (err) {
      console.error('Failed to load packages:', err)
    }
  }

  const loadRates = async () => {
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierCode: selectedCarrier,
          packageCode: selectedPackage,
          fromPostalCode: shipFrom.postalCode,
          toState: shipTo.state,
          toCountry: shipTo.country,
          toPostalCode: shipTo.postalCode,
          weight: {
            value: parseFloat(weight),
            units: 'ounces',
          },
          dimensions: dimensions.length
            ? {
                length: parseFloat(dimensions.length),
                width: parseFloat(dimensions.width),
                height: parseFloat(dimensions.height),
                units: 'inches',
              }
            : undefined,
        }),
      })
      const data = await res.json()
      if (data.rates) {
        setRates(data.rates)
      }
    } catch (err) {
      console.error('Failed to load rates:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/shipping/create-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          carrierCode: selectedCarrier,
          serviceCode: selectedService,
          packageCode: selectedPackage,
          shipDate,
          weight: {
            value: parseFloat(weight),
            units: 'ounces',
          },
          dimensions: dimensions.length
            ? {
                length: parseFloat(dimensions.length),
                width: parseFloat(dimensions.width),
                height: parseFloat(dimensions.height),
                units: 'inches',
              }
            : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create label')
      }

      router.push(`/admin/orders/${order.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create label')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Shipping Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Carrier</Label>
              <Select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
              >
                <option value="">Select carrier</option>
                {carriers.map((carrier) => (
                  <option key={carrier.code} value={carrier.code}>
                    {carrier.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Service</Label>
              <Select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service.code} value={service.code}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Package Type</Label>
              <Select
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
              >
                <option value="">Select package</option>
                {packages.map((pkg) => (
                  <option key={pkg.code} value={pkg.code}>
                    {pkg.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Ship Date</Label>
              <Input
                type="date"
                value={shipDate}
                onChange={(e) => setShipDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Weight (oz)</Label>
              <Input
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Dimensions (optional)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Length (in)"
                type="number"
                step="0.01"
                value={dimensions.length}
                onChange={(e) =>
                  setDimensions({ ...dimensions, length: e.target.value })
                }
              />
              <Input
                placeholder="Width (in)"
                type="number"
                step="0.01"
                value={dimensions.width}
                onChange={(e) =>
                  setDimensions({ ...dimensions, width: e.target.value })
                }
              />
              <Input
                placeholder="Height (in)"
                type="number"
                step="0.01"
                value={dimensions.height}
                onChange={(e) =>
                  setDimensions({ ...dimensions, height: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {rates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rates.map((rate, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 border rounded"
                >
                  <div>
                    <p className="font-medium">{rate.serviceName}</p>
                    <p className="text-sm text-gray-500">
                      {rate.carrierCode} • {rate.packageType}
                    </p>
                  </div>
                  <p className="font-bold">${rate.shipmentCost.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !selectedCarrier || !selectedService}>
          {loading ? 'Creating...' : 'Create Label'}
        </Button>
      </div>
    </form>
  )
}




