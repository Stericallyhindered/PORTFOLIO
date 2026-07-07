'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'

interface CreateLabelModalProps {
  orderId?: string
  order?: any
  onClose: () => void
  onSuccess: () => void
}

export default function CreateLabelModal({ orderId, order, onClose, onSuccess }: CreateLabelModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingCarriers, setLoadingCarriers] = useState(false)
  const [loadingServices, setLoadingServices] = useState(false)
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [error, setError] = useState('')
  const [carriers, setCarriers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [rates, setRates] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    orderId: orderId || '',
    carrierCode: '',
    serviceCode: '',
    packageCode: 'package',
    confirmation: 'delivery',
    shipDate: new Date().toISOString().split('T')[0],
    weight: { value: '', units: 'ounces' },
    dimensions: { length: '', width: '', height: '', units: 'inches' },
    insuranceOptions: {
      insureShipment: false,
      insuredValue: '',
    },
  })

  useEffect(() => {
    loadCarriers()
    if (order?.shippingAddress) {
      // Pre-fill from order
      setFormData(prev => ({
        ...prev,
        orderId: order.id || orderId || '',
      }))
    }
  }, [orderId, order])

  useEffect(() => {
    if (formData.carrierCode) {
      loadServices(formData.carrierCode)
      loadPackages(formData.carrierCode)
    }
  }, [formData.carrierCode])

  const loadCarriers = async () => {
    setLoadingCarriers(true)
    setError('')
    try {
      const response = await fetch('/api/shipping/carriers')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load carriers')
      }
      const result = await response.json()
      const carriersList = result.carriers || []
      setCarriers(carriersList)
      if (carriersList.length === 0) {
        setError('No carriers found. Please check your ShipStation API credentials.')
      }
    } catch (err: any) {
      console.error('Failed to load carriers:', err)
      setError(err.message || 'Failed to load carriers')
      setCarriers([])
    } finally {
      setLoadingCarriers(false)
    }
  }

  const loadServices = async (carrierCode: string) => {
    if (!carrierCode) {
      setServices([])
      return
    }
    setLoadingServices(true)
    setError('')
    try {
      const response = await fetch(`/api/shipping/services?carrier=${carrierCode}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load services')
      }
      const result = await response.json()
      const servicesList = result.services || []
      setServices(servicesList)
      if (servicesList.length === 0) {
        setError(`No services found for carrier ${carrierCode}`)
      }
    } catch (err: any) {
      console.error('Failed to load services:', err)
      setError(err.message || 'Failed to load services')
      setServices([])
    } finally {
      setLoadingServices(false)
    }
  }

  const loadPackages = async (carrierCode: string) => {
    if (!carrierCode) {
      setPackages([])
      return
    }
    setLoadingPackages(true)
    try {
      const response = await fetch(`/api/shipping/packages?carrier=${carrierCode}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load packages')
      }
      const result = await response.json()
      const packagesList = result.packages || []
      setPackages(packagesList)
      // Set default package if available
      if (packagesList.length > 0 && formData.packageCode === 'package') {
        setFormData(prev => ({ ...prev, packageCode: packagesList[0].code }))
      }
    } catch (err: any) {
      console.error('Failed to load packages:', err)
      setError(err.message || 'Failed to load packages')
      setPackages([])
    } finally {
      setLoadingPackages(false)
    }
  }

  const getRates = async () => {
    if (!formData.carrierCode || !formData.weight.value || !order?.shippingAddress) return

    setLoading(true)
    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierCode: formData.carrierCode,
          serviceCode: formData.serviceCode,
          packageCode: formData.packageCode,
          fromPostalCode: '78703', // Default - should come from warehouse
          toState: order.shippingAddress.state,
          toCountry: order.shippingAddress.country || 'US',
          toPostalCode: order.shippingAddress.zip,
          weight: {
            value: parseFloat(formData.weight.value),
            units: formData.weight.units,
          },
          dimensions: formData.dimensions.length ? {
            length: parseFloat(formData.dimensions.length),
            width: parseFloat(formData.dimensions.width),
            height: parseFloat(formData.dimensions.height),
            units: formData.dimensions.units,
          } : undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to get rates')
      const result = await response.json()
      setRates(result.rates || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createLabel = async () => {
    if (!formData.orderId || !formData.carrierCode || !formData.serviceCode || !formData.weight.value) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/shipping/create-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: formData.orderId,
          carrierCode: formData.carrierCode,
          serviceCode: formData.serviceCode,
          packageCode: formData.packageCode,
          confirmation: formData.confirmation,
          shipDate: formData.shipDate,
          weight: {
            value: parseFloat(formData.weight.value),
            units: formData.weight.units,
          },
          dimensions: formData.dimensions.length ? {
            length: parseFloat(formData.dimensions.length),
            width: parseFloat(formData.dimensions.width),
            height: parseFloat(formData.dimensions.height),
            units: formData.dimensions.units,
          } : undefined,
          insuranceOptions: formData.insuranceOptions.insureShipment ? {
            insureShipment: true,
            insuredValue: parseFloat(formData.insuranceOptions.insuredValue),
          } : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create label')
      }

      const result = await response.json()
      if (result.labelUrl) {
        window.open(result.labelUrl, '_blank')
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
          <CardTitle>Create Shipping Label</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
          )}

          <div>
            <Label>Order ID</Label>
            <Input
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Carrier *</Label>
              <Select
                value={formData.carrierCode}
                onChange={(e) => {
                  const selectedCarrier = e.target.value
                  setFormData({ 
                    ...formData, 
                    carrierCode: selectedCarrier, 
                    serviceCode: '',
                    packageCode: 'package'
                  })
                  if (selectedCarrier) {
                    loadServices(selectedCarrier)
                    loadPackages(selectedCarrier)
                  } else {
                    setServices([])
                    setPackages([])
                  }
                }}
                required
                disabled={loadingCarriers}
              >
                <option value="">{loadingCarriers ? 'Loading carriers...' : carriers.length === 0 ? 'No carriers available' : 'Select carrier'}</option>
                {carriers.map((carrier) => (
                  <option key={carrier.code} value={carrier.code}>
                    {carrier.name} {carrier.balance !== undefined ? `($${carrier.balance.toFixed(2)})` : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Service *</Label>
              <Select
                value={formData.serviceCode}
                onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                required
                disabled={!formData.carrierCode || loadingServices}
              >
                <option value="">
                  {!formData.carrierCode 
                    ? 'Select carrier first' 
                    : loadingServices 
                    ? 'Loading services...' 
                    : services.length === 0 
                    ? 'No services available' 
                    : 'Select service'}
                </option>
                {services.map((service) => (
                  <option key={service.code} value={service.code}>
                    {service.name} {service.domestic ? '(Domestic)' : ''} {service.international ? '(International)' : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Package Type *</Label>
              <Select
                value={formData.packageCode}
                onChange={(e) => setFormData({ ...formData, packageCode: e.target.value })}
                required
                disabled={!formData.carrierCode || loadingPackages}
              >
                <option value="package">
                  {!formData.carrierCode 
                    ? 'Select carrier first' 
                    : loadingPackages 
                    ? 'Loading packages...' 
                    : packages.length === 0 
                    ? 'No packages available' 
                    : 'Select package'}
                </option>
                {packages.map((pkg) => (
                  <option key={pkg.code} value={pkg.code}>
                    {pkg.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Confirmation</Label>
              <Select
                value={formData.confirmation}
                onChange={(e) => setFormData({ ...formData, confirmation: e.target.value })}
              >
                <option value="none">None</option>
                <option value="delivery">Delivery</option>
                <option value="signature">Signature</option>
                <option value="adult_signature">Adult Signature</option>
                <option value="direct_signature">Direct Signature (FedEx)</option>
              </Select>
            </div>

            <div>
              <Label>Ship Date *</Label>
              <Input
                type="date"
                value={formData.shipDate}
                onChange={(e) => setFormData({ ...formData, shipDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Weight ({formData.weight.units}) *</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.weight.value}
                  onChange={(e) => setFormData({ ...formData, weight: { ...formData.weight, value: e.target.value } })}
                  required
                />
                <Select
                  value={formData.weight.units}
                  onChange={(e) => setFormData({ ...formData, weight: { ...formData.weight, units: e.target.value } })}
                >
                  <option value="ounces">Ounces</option>
                  <option value="pounds">Pounds</option>
                  <option value="grams">Grams</option>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label>Dimensions (optional)</Label>
            <div className="grid grid-cols-4 gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Length"
                value={formData.dimensions.length}
                onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: e.target.value } })}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Width"
                value={formData.dimensions.width}
                onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, width: e.target.value } })}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Height"
                value={formData.dimensions.height}
                onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, height: e.target.value } })}
              />
              <Select
                value={formData.dimensions.units}
                onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, units: e.target.value } })}
              >
                <option value="inches">Inches</option>
                <option value="centimeters">Centimeters</option>
              </Select>
            </div>
          </div>

          <div className="border rounded p-4">
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.insuranceOptions.insureShipment}
                onChange={(e) => setFormData({
                  ...formData,
                  insuranceOptions: { ...formData.insuranceOptions, insureShipment: e.target.checked }
                })}
              />
              Insure Shipment
            </Label>
            {formData.insuranceOptions.insureShipment && (
              <div className="mt-2">
                <Label>Insured Value ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.insuranceOptions.insuredValue}
                  onChange={(e) => setFormData({
                    ...formData,
                    insuranceOptions: { ...formData.insuranceOptions, insuredValue: e.target.value }
                  })}
                />
              </div>
            )}
          </div>

          {order?.shippingAddress && (
            <Button variant="outline" onClick={getRates} disabled={loading || !formData.carrierCode || !formData.weight.value}>
              Get Rates
            </Button>
          )}

          {rates.length > 0 && (
            <div className="border rounded p-4">
              <Label>Available Rates</Label>
              <div className="space-y-2 mt-2">
                {rates.map((rate: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 border rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => setFormData({ ...formData, serviceCode: rate.serviceCode })}
                  >
                    <div>
                      <p className="font-medium">{rate.serviceName || rate.service}</p>
                      <p className="text-sm text-gray-600">{rate.carrierCode}</p>
                    </div>
                    <p className="font-bold">${(rate.shipmentCost || rate.rate || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={createLabel} disabled={loading}>
              {loading ? 'Creating...' : 'Create Label'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

