'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'

interface ShipStationDashboardProps {
  initialTab?: string
  initialOrderId?: string
  initialShipmentId?: string
}

export default function ShipStationDashboard({
  initialTab = 'orders',
  initialOrderId,
  initialShipmentId,
}: ShipStationDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<any>(null)

  // Orders tab state
  const [orders, setOrders] = useState<any[]>([])
  const [orderFilters, setOrderFilters] = useState({
    orderStatus: '',
    page: 1,
    pageSize: 50,
    orderDateStart: '',
    orderDateEnd: '',
  })

  // Shipments tab state
  const [shipments, setShipments] = useState<any[]>([])
  const [shipmentFilters, setShipmentFilters] = useState({
    page: 1,
    pageSize: 50,
  })

  // Carriers tab state
  const [carriers, setCarriers] = useState<any[]>([])
  const [selectedCarrier, setSelectedCarrier] = useState('')
  const [carrierServices, setCarrierServices] = useState<any[]>([])

  // Rates tab state
  const [rateData, setRateData] = useState({
    carrierCode: '',
    serviceCode: '',
    packageCode: '',
    fromPostalCode: '',
    toState: '',
    toCountry: 'US',
    toPostalCode: '',
    weight: { value: '', units: 'ounces' },
    dimensions: { length: '', width: '', height: '', units: 'inches' },
  })
  const [rates, setRates] = useState<any[]>([])

  // Labels tab state
  const [labelData, setLabelData] = useState({
    orderId: '',
    carrierCode: '',
    serviceCode: '',
    packageCode: '',
    shipDate: new Date().toISOString().split('T')[0],
    weight: { value: '', units: 'ounces' },
    dimensions: { length: '', width: '', height: '', units: 'inches' },
  })

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders()
    } else if (activeTab === 'shipments') {
      loadShipments()
    } else if (activeTab === 'carriers') {
      loadCarriers()
    }
  }, [activeTab, orderFilters, shipmentFilters])

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (orderFilters.orderStatus) params.set('orderStatus', orderFilters.orderStatus)
      params.set('page', orderFilters.page.toString())
      params.set('pageSize', orderFilters.pageSize.toString())
      if (orderFilters.orderDateStart) params.set('orderDateStart', orderFilters.orderDateStart)
      if (orderFilters.orderDateEnd) params.set('orderDateEnd', orderFilters.orderDateEnd)

      const response = await fetch(`/api/admin/shipstation/orders?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to load orders')

      const result = await response.json()
      setOrders(result.orders || [])
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadShipments = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', shipmentFilters.page.toString())
      params.set('pageSize', shipmentFilters.pageSize.toString())

      const response = await fetch(`/api/admin/shipstation/shipments?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to load shipments')

      const result = await response.json()
      setShipments(result.shipments || [])
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCarriers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/shipping/carriers')
      if (!response.ok) throw new Error('Failed to load carriers')

      const result = await response.json()
      setCarriers(result.carriers || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCarrierServices = async (carrierCode: string) => {
    if (!carrierCode) return
    setLoading(true)
    try {
      const response = await fetch(`/api/shipping/services?carrier=${carrierCode}`)
      if (!response.ok) throw new Error('Failed to load services')

      const result = await response.json()
      setCarrierServices(result.services || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateRates = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierCode: rateData.carrierCode,
          serviceCode: rateData.serviceCode,
          packageCode: rateData.packageCode,
          fromPostalCode: rateData.fromPostalCode,
          toState: rateData.toState,
          toCountry: rateData.toCountry,
          toPostalCode: rateData.toPostalCode,
          weight: {
            value: parseFloat(rateData.weight.value),
            units: rateData.weight.units,
          },
          dimensions: rateData.dimensions.length
            ? {
                length: parseFloat(rateData.dimensions.length),
                width: parseFloat(rateData.dimensions.width),
                height: parseFloat(rateData.dimensions.height),
                units: rateData.dimensions.units,
              }
            : undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to calculate rates')

      const result = await response.json()
      setRates(result.rates || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createLabel = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/shipping/create-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: labelData.orderId,
          carrierCode: labelData.carrierCode,
          serviceCode: labelData.serviceCode,
          packageCode: labelData.packageCode,
          shipDate: labelData.shipDate,
          weight: {
            value: parseFloat(labelData.weight.value),
            units: labelData.weight.units,
          },
          dimensions: labelData.dimensions.length
            ? {
                length: parseFloat(labelData.dimensions.length),
                width: parseFloat(labelData.dimensions.width),
                height: parseFloat(labelData.dimensions.height),
                units: labelData.dimensions.units,
              }
            : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create label')
      }

      const result = await response.json()
      alert('Label created successfully!')
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const voidLabel = async (shipmentId: string) => {
    if (!confirm('Are you sure you want to void this label?')) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/shipstation/void-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId }),
      })

      if (!response.ok) throw new Error('Failed to void label')

      alert('Label voided successfully!')
      loadShipments()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'orders'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'shipments'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Shipments
          </button>
          <button
            onClick={() => setActiveTab('carriers')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'carriers'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Carriers & Services
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'rates'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Get Rates
          </button>
          <button
            onClick={() => setActiveTab('labels')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'labels'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Label
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'reports'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>View and manage ShipStation orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Order Status</Label>
                  <Select
                    value={orderFilters.orderStatus}
                    onChange={(e) =>
                      setOrderFilters({ ...orderFilters, orderStatus: e.target.value })
                    }
                  >
                    <option value="">All Statuses</option>
                    <option value="awaiting_payment">Awaiting Payment</option>
                    <option value="awaiting_shipment">Awaiting Shipment</option>
                    <option value="shipped">Shipped</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={orderFilters.orderDateStart}
                    onChange={(e) =>
                      setOrderFilters({ ...orderFilters, orderDateStart: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={orderFilters.orderDateEnd}
                    onChange={(e) =>
                      setOrderFilters({ ...orderFilters, orderDateEnd: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={loadOrders} disabled={loading}>
                    {loading ? 'Loading...' : 'Filter'}
                  </Button>
                </div>
              </div>
            </div>

            {loading && <p className="text-center py-4">Loading orders...</p>}
            {!loading && orders.length === 0 && (
              <p className="text-center py-4 text-gray-500">No orders found</p>
            )}
            {!loading && orders.length > 0 && (
              <div className="space-y-2">
                {orders.map((order: any) => (
                  <div
                    key={order.orderId || order.orderNumber}
                    className="border rounded p-4 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-semibold">
                        {order.orderNumber || order.orderId}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {order.customerName || order.email} | Status: {order.orderStatus}
                      </p>
                      <p className="text-sm text-gray-600">
                        Total: {formatPrice((order.orderTotal || order.total || 0) * 100)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/orders/${order.orderId || order.id}`}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => window.location.href = `/admin/shipping/${order.orderId || order.id}/create-label`}
                      >
                        Create Label
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shipments Tab */}
      {activeTab === 'shipments' && (
        <Card>
          <CardHeader>
            <CardTitle>Shipments</CardTitle>
            <CardDescription>View and manage shipments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-center py-4">Loading shipments...</p>}
            {!loading && shipments.length === 0 && (
              <p className="text-center py-4 text-gray-500">No shipments found</p>
            )}
            {!loading && shipments.length > 0 && (
              <div className="space-y-2">
                {shipments.map((shipment: any) => (
                  <div
                    key={shipment.shipmentId || shipment.id}
                    className="border rounded p-4 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-semibold">
                        Shipment #{shipment.shipmentId || shipment.id}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Order: {shipment.orderNumber || shipment.orderId} | Carrier: {shipment.carrierCode || shipment.carrier} | Service: {shipment.serviceCode || shipment.service}
                      </p>
                      <p className="text-sm text-gray-600">
                        Tracking: {shipment.trackingNumber || 'N/A'} | Cost: {formatPrice((shipment.shipmentCost || shipment.cost || 0) * 100)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {shipment.labelUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(shipment.labelUrl, '_blank')}
                        >
                          View Label
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => voidLabel(shipment.shipmentId || shipment.id)}
                        disabled={loading}
                      >
                        Void Label
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Carriers Tab */}
      {activeTab === 'carriers' && (
        <Card>
          <CardHeader>
            <CardTitle>Carriers & Services</CardTitle>
            <CardDescription>View available carriers and their services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Select Carrier</Label>
                <Select
                  value={selectedCarrier}
                  onChange={(e) => {
                    setSelectedCarrier(e.target.value)
                    loadCarrierServices(e.target.value)
                  }}
                >
                  <option value="">Select a carrier</option>
                  {carriers.map((carrier: any) => (
                    <option key={carrier.code} value={carrier.code}>
                      {carrier.name}
                    </option>
                  ))}
                </Select>
              </div>

              {carrierServices.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Available Services</h4>
                  <div className="space-y-2">
                    {carrierServices.map((service: any) => (
                      <div key={service.code} className="border rounded p-3">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-600">Code: {service.code}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rates Tab */}
      {activeTab === 'rates' && (
        <Card>
          <CardHeader>
            <CardTitle>Get Shipping Rates</CardTitle>
            <CardDescription>Calculate shipping rates for a shipment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Carrier</Label>
                  <Select
                    value={rateData.carrierCode}
                    onChange={(e) => setRateData({ ...rateData, carrierCode: e.target.value })}
                  >
                    <option value="">Select carrier</option>
                    {carriers.map((carrier: any) => (
                      <option key={carrier.code} value={carrier.code}>
                        {carrier.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Service</Label>
                  <Input
                    value={rateData.serviceCode}
                    onChange={(e) => setRateData({ ...rateData, serviceCode: e.target.value })}
                    placeholder="Service code"
                  />
                </div>
                <div>
                  <Label>From ZIP Code</Label>
                  <Input
                    value={rateData.fromPostalCode}
                    onChange={(e) => setRateData({ ...rateData, fromPostalCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label>To ZIP Code</Label>
                  <Input
                    value={rateData.toPostalCode}
                    onChange={(e) => setRateData({ ...rateData, toPostalCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label>To State</Label>
                  <Input
                    value={rateData.toState}
                    onChange={(e) => setRateData({ ...rateData, toState: e.target.value })}
                  />
                </div>
                <div>
                  <Label>To Country</Label>
                  <Input
                    value={rateData.toCountry}
                    onChange={(e) => setRateData({ ...rateData, toCountry: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Weight (oz)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rateData.weight.value}
                    onChange={(e) =>
                      setRateData({
                        ...rateData,
                        weight: { ...rateData.weight, value: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Package Type</Label>
                  <Input
                    value={rateData.packageCode}
                    onChange={(e) => setRateData({ ...rateData, packageCode: e.target.value })}
                    placeholder="package"
                  />
                </div>
              </div>
              <Button onClick={calculateRates} disabled={loading}>
                {loading ? 'Calculating...' : 'Get Rates'}
              </Button>

              {rates.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Available Rates</h4>
                  <div className="space-y-2">
                    {rates.map((rate: any, index: number) => (
                      <div key={index} className="border rounded p-3 flex justify-between">
                        <div>
                          <p className="font-medium">{rate.serviceName || rate.service}</p>
                          <p className="text-sm text-gray-600">
                            {rate.carrierCode} • {rate.packageType || rateData.packageCode}
                          </p>
                        </div>
                        <p className="font-bold">
                          {formatPrice((rate.shipmentCost || rate.rate || 0) * 100)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Labels Tab */}
      {activeTab === 'labels' && (
        <Card>
          <CardHeader>
            <CardTitle>Create Shipping Label</CardTitle>
            <CardDescription>Create a shipping label for an order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Order ID</Label>
                <Input
                  value={labelData.orderId}
                  onChange={(e) => setLabelData({ ...labelData, orderId: e.target.value })}
                  placeholder="Order ID from your system"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Carrier</Label>
                  <Select
                    value={labelData.carrierCode}
                    onChange={(e) => setLabelData({ ...labelData, carrierCode: e.target.value })}
                  >
                    <option value="">Select carrier</option>
                    {carriers.map((carrier: any) => (
                      <option key={carrier.code} value={carrier.code}>
                        {carrier.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Service</Label>
                  <Input
                    value={labelData.serviceCode}
                    onChange={(e) => setLabelData({ ...labelData, serviceCode: e.target.value })}
                    placeholder="Service code"
                  />
                </div>
                <div>
                  <Label>Package Type</Label>
                  <Input
                    value={labelData.packageCode}
                    onChange={(e) => setLabelData({ ...labelData, packageCode: e.target.value })}
                    placeholder="package"
                  />
                </div>
                <div>
                  <Label>Ship Date</Label>
                  <Input
                    type="date"
                    value={labelData.shipDate}
                    onChange={(e) => setLabelData({ ...labelData, shipDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Weight (oz)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={labelData.weight.value}
                    onChange={(e) =>
                      setLabelData({
                        ...labelData,
                        weight: { ...labelData.weight, value: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <Button onClick={createLabel} disabled={loading || !labelData.orderId}>
                {loading ? 'Creating...' : 'Create Label'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>View ShipStation reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => window.location.href = '/admin/reports?type=sales'}>
                Sales Report
              </Button>
              <Button onClick={() => window.location.href = '/admin/reports?type=shipping'}>
                Shipping Report
              </Button>
              <Button onClick={() => window.location.href = '/admin/reports?type=tax'}>
                Tax Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


