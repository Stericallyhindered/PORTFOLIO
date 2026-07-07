'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { Search, Package, Truck, DollarSign, FileText, Settings, Users, Store, Warehouse, Bell, TrendingUp, Filter, Download, Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, AlertCircle, MoreVertical } from 'lucide-react'
import CreateLabelModal from './CreateLabelModal'
import OrderActionsModal from './OrderActionsModal'
import CreateWebhookModal from './CreateWebhookModal'
import CreateWarehouseModal from './CreateWarehouseModal'

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

interface ShippingDashboardProps {
  initialTab?: string
}

export default function ShippingDashboard({ initialTab = 'overview' }: ShippingDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Overview stats
  const [stats, setStats] = useState({
    awaitingShipment: 0,
    shippedToday: 0,
    totalRevenue: 0,
    avgShippingCost: 0,
  })

  // Orders
  const [orders, setOrders] = useState<any[]>([])
  const [orderFilters, setOrderFilters] = useState({
    orderStatus: '',
    search: '',
    page: 1,
    pageSize: 50,
  })

  // Shipments
  const [shipments, setShipments] = useState<any[]>([])
  const [shipmentFilters, setShipmentFilters] = useState({
    search: '',
    page: 1,
    pageSize: 50,
  })

  // Carriers
  const [carriers, setCarriers] = useState<any[]>([])
  const [selectedCarrier, setSelectedCarrier] = useState('')
  const [carrierServices, setCarrierServices] = useState<any[]>([])

  // Stores
  const [stores, setStores] = useState<any[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [savingStore, setSavingStore] = useState(false)

  // Warehouses
  const [warehouses, setWarehouses] = useState<any[]>([])

  // Webhooks
  const [webhooks, setWebhooks] = useState<any[]>([])
  
  // Modals
  const [showCreateLabel, setShowCreateLabel] = useState(false)
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<any>(null)
  const [showOrderActions, setShowOrderActions] = useState(false)
  const [selectedOrderForActions, setSelectedOrderForActions] = useState<any>(null)
  
  // Warehouse management
  const [showCreateWarehouse, setShowCreateWarehouse] = useState(false)
  
  // Webhook management
  const [showCreateWebhook, setShowCreateWebhook] = useState(false)

  useEffect(() => {
    loadOverview()
    if (activeTab === 'orders') loadOrders()
    else if (activeTab === 'shipments') loadShipments()
    else if (activeTab === 'carriers') loadCarriers()
    else if (activeTab === 'stores') loadStores()
    else if (activeTab === 'warehouses') loadWarehouses()
    else if (activeTab === 'webhooks') loadWebhooks()
  }, [activeTab, orderFilters, shipmentFilters])

  const loadOverview = async () => {
    setLoading(true)
    try {
      // Load from local database orders
      const [pendingRes, shippedRes] = await Promise.all([
        fetch('/api/admin/orders?status=PENDING&pageSize=1'),
        fetch('/api/admin/orders?status=SHIPPED&pageSize=1'),
      ])
      
      const pendingData = await pendingRes.json()
      const shippedData = await shippedRes.json()
      
      setStats({
        awaitingShipment: pendingData.total || 0,
        shippedToday: shippedData.total || 0,
        totalRevenue: 0,
        avgShippingCost: 0,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (orderFilters.orderStatus) params.set('status', orderFilters.orderStatus)
      params.set('page', orderFilters.page.toString())
      params.set('pageSize', orderFilters.pageSize.toString())
      if (orderFilters.search) params.set('search', orderFilters.search)

      const response = await fetch(`/api/admin/orders?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to load orders')

      const result = await response.json()
      setOrders(result.orders || [])
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCarriers = async () => {
    setLoading(true)
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

  const loadStores = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/shipstation/stores')
      if (!response.ok) throw new Error('Failed to load stores')

      const result = await response.json()
      setStores(result.stores || [])
      setSelectedStoreId(result.selectedStoreId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveSelectedStore = async (storeId: number) => {
    setSavingStore(true)
    try {
      const response = await fetch('/api/admin/shipstation/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      })
      if (!response.ok) throw new Error('Failed to save store')
      setSelectedStoreId(storeId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingStore(false)
    }
  }

  const loadWarehouses = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/shipstation/warehouses')
      if (!response.ok) throw new Error('Failed to load warehouses')

      const result = await response.json()
      setWarehouses(result.warehouses || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadWebhooks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/shipstation/webhooks')
      if (!response.ok) throw new Error('Failed to load webhooks')

      const result = await response.json()
      setWebhooks(result.webhooks || [])
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      awaiting_shipment: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      shipped: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      on_hold: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    }
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: Package }
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shipping Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage orders, shipments, and carriers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/admin/orders/new'}>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
          <Button onClick={() => {
            setSelectedOrderForLabel(null)
            setShowCreateLabel(true)
          }}>
            <Package className="w-4 h-4 mr-2" />
            Create Label
          </Button>
        </div>
      </div>

      {/* Stats Overview - Always visible */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Awaiting Shipment</p>
                <p className="text-2xl font-bold mt-1">{stats.awaitingShipment}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shipped Today</p>
                <p className="text-2xl font-bold mt-1">{stats.shippedToday}</p>
              </div>
              <Truck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Shipping Cost</p>
                <p className="text-2xl font-bold mt-1">{formatPrice(stats.avgShippingCost)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'shipments', label: 'Shipments', icon: Truck },
            { id: 'carriers', label: 'Carriers', icon: Settings },
            { id: 'stores', label: 'Stores', icon: Store },
            { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
            { id: 'webhooks', label: 'Webhooks', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.slice(0, 5).map((order: any) => (
                  <div key={order.orderId || order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{order.orderNumber || order.orderId}</p>
                      <p className="text-sm text-gray-600">{order.customerName || order.email}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.orderStatus || order.status)}
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No recent orders</p>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('orders')}>
                View All Orders
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shipments.slice(0, 5).map((shipment: any) => (
                  <div key={shipment.shipmentId || shipment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium">#{shipment.shipmentId || shipment.id}</p>
                      <p className="text-sm text-gray-600">{shipment.trackingNumber || 'No tracking'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatPrice((shipment.shipmentCost || shipment.cost || 0) * 100)}</p>
                      <p className="text-xs text-gray-500">{shipment.carrierCode || shipment.carrier}</p>
                    </div>
                  </div>
                ))}
                {shipments.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No recent shipments</p>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('shipments')}>
                View All Shipments
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>Manage and track all orders</CardDescription>
              </div>
              <Button onClick={() => window.location.href = '/admin/orders/new'}>
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search orders..."
                      value={orderFilters.search}
                      onChange={(e) => setOrderFilters({ ...orderFilters, search: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={orderFilters.orderStatus}
                  onChange={(e) => setOrderFilters({ ...orderFilters, orderStatus: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="awaiting_payment">Awaiting Payment</option>
                  <option value="awaiting_shipment">Awaiting Shipment</option>
                  <option value="shipped">Shipped</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
                <Button onClick={loadOrders} disabled={loading}>
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Orders Table */}
              {loading && <p className="text-center py-8">Loading orders...</p>}
              {!loading && orders.length === 0 && (
                <p className="text-center py-8 text-gray-500">No orders found</p>
              )}
              {!loading && orders.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map((order: any) => (
                        <tr key={order.orderId || order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium">{order.orderNumber || order.orderId}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">{order.customerName || order.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(order.orderStatus || order.status)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{formatPrice((order.orderTotal || order.total || 0) * 100)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-600">
                              {order.orderDate ? formatDate(new Date(order.orderDate)) : 'N/A'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = `/admin/orders/${order.orderId || order.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedOrderForLabel(order)
                                  setShowCreateLabel(true)
                                }}
                              >
                                <Package className="w-4 h-4 mr-1" />
                                Label
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrderForActions(order)
                                  setShowOrderActions(true)
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipments Tab */}
      {activeTab === 'shipments' && (
        <Card>
          <CardHeader>
            <CardTitle>Shipments</CardTitle>
            <CardDescription>View and manage all shipments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-center py-8">Loading shipments...</p>}
            {!loading && shipments.length === 0 && (
              <p className="text-center py-8 text-gray-500">No shipments found</p>
            )}
            {!loading && shipments.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {shipments.map((shipment: any) => (
                      <tr key={shipment.shipmentId || shipment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">#{shipment.shipmentId || shipment.id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{shipment.orderNumber || shipment.orderId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-mono">{shipment.trackingNumber || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{shipment.carrierCode || shipment.carrier}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{formatPrice((shipment.shipmentCost || shipment.cost || 0) * 100)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {shipment.labelUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(shipment.labelUrl, '_blank')}
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!confirm('Void this label?')) return
                                try {
                                  await fetch('/api/admin/shipstation/void-label', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ shipmentId: shipment.shipmentId || shipment.id }),
                                  })
                                  loadShipments()
                                } catch (err) {
                                  alert('Failed to void label')
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Carriers Tab */}
      {activeTab === 'carriers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Carriers</CardTitle>
              <CardDescription>Manage shipping carriers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {carriers.map((carrier: any) => (
                  <div
                    key={carrier.code}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedCarrier === carrier.code ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedCarrier(carrier.code)
                      loadCarrierServices(carrier.code)
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{carrier.name}</p>
                        <p className="text-sm text-gray-600">Code: {carrier.code}</p>
                      </div>
                      {carrier.balance !== undefined && (
                        <p className="text-sm font-medium">${carrier.balance.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedCarrier && (
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>Available services for {carriers.find(c => c.code === selectedCarrier)?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {carrierServices.length > 0 ? (
                  <div className="space-y-2">
                    {carrierServices.map((service: any) => (
                      <div key={service.code} className="p-3 border rounded-lg">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-600">Code: {service.code}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Select a carrier to view services</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stores Tab */}
      {activeTab === 'stores' && (
        <div className="space-y-6">
          {/* Store Selection Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Website Store Connection
              </CardTitle>
              <CardDescription>
                Select which ShipStation store to associate with orders from your website.
                This prevents orders from appearing as &quot;Manual Orders&quot; in ShipStation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stores.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Select
                      value={selectedStoreId?.toString() || ''}
                      onChange={(e) => {
                        const storeId = parseInt(e.target.value)
                        if (storeId) saveSelectedStore(storeId)
                      }}
                      className="flex-1"
                      disabled={savingStore}
                    >
                      <option value="">-- Select a store --</option>
                      {stores.map((store: any) => (
                        <option key={store.storeId} value={store.storeId}>
                          {store.storeName} ({store.marketplaceName})
                        </option>
                      ))}
                    </Select>
                    {savingStore && <span className="text-sm text-gray-500">Saving...</span>}
                  </div>
                  {selectedStoreId && (
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Orders from your website will be linked to this store
                    </div>
                  )}
                  {!selectedStoreId && (
                    <div className="flex items-center gap-2 text-amber-700 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      No store selected - orders will appear as &quot;Manual Orders&quot; in ShipStation
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    No stores found in ShipStation. Create a Custom Store in ShipStation first.
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://ship.shipstation.com/settings/stores/add', '_blank')}
                  >
                    Create Store in ShipStation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Stores List */}
          <Card>
            <CardHeader>
              <CardTitle>All Connected Stores</CardTitle>
              <CardDescription>All stores connected to your ShipStation account</CardDescription>
            </CardHeader>
            <CardContent>
              {stores.length > 0 ? (
                <div className="space-y-3">
                  {stores.map((store: any) => (
                    <div 
                      key={store.storeId} 
                      className={`p-4 border rounded-lg flex justify-between items-center ${
                        selectedStoreId === store.storeId ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {store.storeName}
                          {selectedStoreId === store.storeId && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs">
                              Website Store
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">{store.marketplaceName}</p>
                        <p className="text-xs text-gray-400 mt-1">Store ID: {store.storeId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${store.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {store.active ? 'Active' : 'Inactive'}
                        </span>
                        {selectedStoreId !== store.storeId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveSelectedStore(store.storeId)}
                            disabled={savingStore}
                          >
                            Use This Store
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No stores found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warehouses Tab */}
      {activeTab === 'warehouses' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Warehouses</CardTitle>
                <CardDescription>Manage ship-from locations</CardDescription>
              </div>
              <Button onClick={() => setShowCreateWarehouse(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Warehouse
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {warehouses.length > 0 ? (
              <div className="space-y-3">
                {warehouses.map((warehouse: any) => (
                  <div key={warehouse.warehouseId} className="p-4 border rounded-lg flex justify-between items-start">
                    <div>
                      <p className="font-medium">{warehouse.warehouseName}</p>
                      <p className="text-sm text-gray-600">
                        {warehouse.originAddress?.city}, {warehouse.originAddress?.state} {warehouse.originAddress?.postalCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {warehouse.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Default</span>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('Delete this warehouse?')) return
                          try {
                            await fetch(`/api/admin/shipstation/warehouses/${warehouse.warehouseId}`, {
                              method: 'DELETE',
                            })
                            loadWarehouses()
                          } catch (err) {
                            alert('Failed to delete warehouse')
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No warehouses found</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>Manage webhook subscriptions</CardDescription>
              </div>
              <Button onClick={() => setShowCreateWebhook(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Subscribe Webhook
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {webhooks.length > 0 ? (
              <div className="space-y-3">
                {webhooks.map((webhook: any) => (
                  <div key={webhook.WebHookID || webhook.id} className="p-4 border rounded-lg flex justify-between items-start">
                    <div>
                      <p className="font-medium">{webhook.Name || webhook.friendly_name}</p>
                      <p className="text-sm text-gray-600">{webhook.Url || webhook.target_url}</p>
                      <p className="text-xs text-gray-500 mt-1">Event: {webhook.HookType || webhook.event}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${webhook.Active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {webhook.Active ? 'Active' : 'Inactive'}
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('Unsubscribe from this webhook?')) return
                          try {
                            await fetch(`/api/admin/shipstation/webhooks/${webhook.WebHookID || webhook.id}`, {
                              method: 'DELETE',
                            })
                            loadWebhooks()
                          } catch (err) {
                            alert('Failed to unsubscribe')
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No webhooks configured</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showCreateLabel && (
        <CreateLabelModal
          orderId={selectedOrderForLabel?.id || selectedOrderForLabel?.orderId}
          order={selectedOrderForLabel}
          onClose={() => {
            setShowCreateLabel(false)
            setSelectedOrderForLabel(null)
          }}
          onSuccess={() => {
            loadOrders()
            loadShipments()
            loadOverview()
          }}
        />
      )}

      {showOrderActions && selectedOrderForActions && (
        <OrderActionsModal
          order={selectedOrderForActions}
          onClose={() => {
            setShowOrderActions(false)
            setSelectedOrderForActions(null)
          }}
          onSuccess={() => {
            loadOrders()
            loadOverview()
          }}
        />
      )}

      {showCreateWebhook && (
        <CreateWebhookModal
          onClose={() => setShowCreateWebhook(false)}
          onSuccess={() => {
            loadWebhooks()
          }}
        />
      )}

      {showCreateWarehouse && (
        <CreateWarehouseModal
          onClose={() => setShowCreateWarehouse(false)}
          onSuccess={() => {
            loadWarehouses()
          }}
        />
      )}
    </div>
  )
}

