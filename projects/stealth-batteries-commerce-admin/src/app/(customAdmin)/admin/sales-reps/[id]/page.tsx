'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertCircle,
  ArrowLeft,
  Save,
  Edit,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  Building2,
  ShoppingCart,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Check,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { filterOrdersByAssignmentDate } from '@/utilities/filterOrdersByAssignmentDate'

interface SalesRep {
  id: string
  name: string
  email: string
  role: 'rep' | 'senior_rep' | 'manager' | 'director' | 'vp_sales'
  commissionRate: number
  targetQuota: number
  active: boolean
  createdAt: string
  updatedAt: string
}

interface Dealer {
  id: string
  name: string
  companyName: string
  email: string
  phone?: string
  active: boolean
  emailVerified: boolean
  taxExempt: boolean
  createdAt: string
  // Performance metrics
  totalOrders?: number
  totalSales?: number
  lastOrderDate?: string
}

interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
  total: number
  createdAt: string
  dealer: {
    id: string
    name: string
    companyName: string
  }
  items: Array<{
    product: {
      title: string
    }
    quantity: number
    price: number
  }>
}

interface PerformanceMetrics {
  totalSales: number
  totalCommission: number
  totalOrders: number
  averageOrderValue: number
  quotaProgress: number
  thisMonthSales: number
  thisMonthCommission: number
  lastMonthSales: number
  lastMonthCommission: number
}

const roleLabels = {
  rep: 'Sales Representative',
  senior_rep: 'Senior Representative',
  manager: 'Manager',
  director: 'Director',
  vp_sales: 'VP Sales',
}

const roleOptions = [
  { value: 'rep', label: 'Sales Representative' },
  { value: 'senior_rep', label: 'Senior Representative' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' },
  { value: 'vp_sales', label: 'VP Sales' },
]

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function PerformanceCard({ metrics }: { metrics: PerformanceMetrics }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-400" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(metrics.totalSales)}
            </div>
            <div className="text-xs text-zinc-400">Total Sales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {formatCurrency(metrics.totalCommission)}
            </div>
            <div className="text-xs text-zinc-400">Total Commission</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{metrics.totalOrders}</div>
            <div className="text-xs text-zinc-400">Total Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {formatCurrency(metrics.averageOrderValue)}
            </div>
            <div className="text-xs text-zinc-400">Avg Order Value</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-400">Quota Progress</span>
            <span className="text-sm text-zinc-400">{metrics.quotaProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                metrics.quotaProgress >= 100
                  ? 'bg-green-500'
                  : metrics.quotaProgress >= 75
                    ? 'bg-yellow-500'
                    : metrics.quotaProgress >= 50
                      ? 'bg-orange-500'
                      : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(metrics.quotaProgress, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="text-sm text-zinc-400 mb-2">Monthly Comparison</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-white font-medium">This Month</div>
              <div className="text-green-400">{formatCurrency(metrics.thisMonthSales)}</div>
              <div className="text-zinc-400">
                {formatCurrency(metrics.thisMonthCommission)} commission
              </div>
            </div>
            <div>
              <div className="text-white font-medium">Last Month</div>
              <div className="text-blue-400">{formatCurrency(metrics.lastMonthSales)}</div>
              <div className="text-zinc-400">
                {formatCurrency(metrics.lastMonthCommission)} commission
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DealerCard({ dealer }: { dealer: Dealer }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-white">{dealer.name}</h3>
            <p className="text-sm text-zinc-400">{dealer.companyName}</p>
          </div>
          <div className="flex gap-1">
            <Badge className={`${dealer.active ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {dealer.active ? 'Active' : 'Inactive'}
            </Badge>
            {dealer.emailVerified && (
              <Badge className="bg-blue-500 text-white">
                <Check className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-zinc-400">
            <Mail className="h-3 w-3" />
            <span>{dealer.email}</span>
          </div>
          {dealer.phone && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Phone className="h-3 w-3" />
              <span>{dealer.phone}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-zinc-400">Total Orders</div>
              <div className="text-white font-medium">{dealer.totalOrders || 0}</div>
            </div>
            <div>
              <div className="text-zinc-400">Total Sales</div>
              <div className="text-green-400 font-medium">
                {formatCurrency(dealer.totalSales || 0)}
              </div>
            </div>
          </div>
          {dealer.lastOrderDate && (
            <div className="mt-2 text-xs text-zinc-400">
              Last order: {format(new Date(dealer.lastOrderDate), 'MMM d, yyyy')}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" asChild className="flex-1">
            <Link href={`/admin/dealers?search=${dealer.email}`}>View Details</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/collections/dealers/${dealer.id}`} target="_blank">
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function OrderCard({ order }: { order: Order }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500',
      processing: 'bg-blue-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
      refunded: 'bg-gray-500',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500'
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-white">#{order.orderNumber}</h3>
            <p className="text-sm text-zinc-400">{order.dealer.companyName}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={`${getStatusColor(order.status)} text-white`}>{order.status}</Badge>
            <div className="text-sm font-medium text-green-400">{formatCurrency(order.total)}</div>
          </div>
        </div>

        <div className="text-sm text-zinc-400 mb-3">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''} •{' '}
          {format(new Date(order.createdAt), 'MMM d, yyyy')}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild className="flex-1">
            <Link href={`/admin/orders/${order.id}`}>View Order</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/collections/orders/${order.id}`} target="_blank">
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SalesRepDetailPage() {
  const params = useParams()
  const router = useRouter()
  const salesRepId = params.id as string

  const [salesRep, setSalesRep] = useState<SalesRep | null>(null)
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'rep' as const,
    commissionRate: 0,
    targetQuota: 0,
    active: true,
  })

  useEffect(() => {
    const fetchSalesRepData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch sales rep details
        const salesRepResponse = await fetch(`/api/salesReps/${salesRepId}`)
        if (!salesRepResponse.ok) {
          throw new Error('Failed to fetch sales rep')
        }
        const salesRepData = await salesRepResponse.json()
        setSalesRep(salesRepData)
        setFormData({
          name: salesRepData.name,
          email: salesRepData.email,
          role: salesRepData.role,
          commissionRate: salesRepData.commissionRate,
          targetQuota: salesRepData.targetQuota,
          active: salesRepData.active,
        })

        // Fetch assigned dealers
        let validDealers: any[] = []
        const dealersResponse = await fetch(
          `/api/dealers?where=${JSON.stringify({ salesRep: { equals: salesRepId } })}&limit=100`,
        )
        if (dealersResponse.ok) {
          const dealersData = await dealersResponse.json()
          // Debug: uncomment to see dealer assignment details
          // console.log('Dealers API response for sales rep', salesRepId, ':', dealersData)

          // Filter dealers to only include those actually assigned to this sales rep
          validDealers = dealersData.docs.filter((dealer: any) => {
            return dealer.salesRep === salesRepId
          })

          const dealersWithMetrics = await Promise.all(
            validDealers.map(async (dealer: any) => {
              try {
                // Use the custom orders API with dealerId parameter
                const params = new URLSearchParams({
                  dealerId: dealer.id.toString(),
                })

                const ordersResponse = await fetch(`/api/orders?${params}`, {
                  credentials: 'include',
                })

                if (ordersResponse.ok) {
                  const ordersData = await ordersResponse.json()
                  const dealerOrders = ordersData.orders || []

                  const totalOrders = dealerOrders.length
                  const totalSales = dealerOrders.reduce(
                    (sum: number, order: any) => sum + (order.total || 0),
                    0,
                  )
                  const lastOrderDate = dealerOrders.length > 0 ? dealerOrders[0].createdAt : null

                  return {
                    ...dealer,
                    totalOrders,
                    totalSales,
                    lastOrderDate,
                  }
                } else {
                  return {
                    ...dealer,
                    totalOrders: 0,
                    totalSales: 0,
                    lastOrderDate: null,
                  }
                }
              } catch (error) {
                console.error(`Error fetching metrics for dealer ${dealer.id}:`, error)
                return {
                  ...dealer,
                  totalOrders: 0,
                  totalSales: 0,
                  lastOrderDate: null,
                }
              }
            }),
          )
          setDealers(dealersWithMetrics)
        }

        // Fetch orders for this sales rep
        const allOrders: any[] = []
        if (validDealers.length > 0) {
          // Get all orders from all assigned dealers
          for (const dealer of validDealers) {
            try {
              const params = new URLSearchParams({
                dealerId: dealer.id.toString(),
              })

              const ordersResponse = await fetch(`/api/orders?${params}`, {
                credentials: 'include',
              })

              if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json()
                if (ordersData.orders) {
                  allOrders.push(...ordersData.orders)
                }
              }
            } catch (error) {
              console.error(`Error fetching orders for dealer ${dealer.id}:`, error)
            }
          }
        }

        // Filter orders to only include those placed after assignment dates
        const filteredOrders = filterOrdersByAssignmentDate(allOrders as any, salesRepId) as any[]

        // Sort orders by creation date (newest first) and limit to 100 for display
        const sortedOrders = filteredOrders.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        setOrders(sortedOrders.slice(0, 100) as any)

        // Calculate performance metrics using filtered orders
        const totalSales = filteredOrders.reduce(
          (sum: number, order: any) => sum + (order.total || 0),
          0,
        )
        const totalCommission = totalSales * (salesRepData.commissionRate / 100)
        const totalOrders = filteredOrders.length
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
        const quotaProgress =
          salesRepData.targetQuota > 0 ? (totalSales / salesRepData.targetQuota) * 100 : 0

        // Calculate this month and last month
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

        const thisMonthOrders = filteredOrders.filter(
          (order: any) => new Date(order.createdAt) >= thisMonthStart,
        )
        const lastMonthOrders = filteredOrders.filter(
          (order: any) =>
            new Date(order.createdAt) >= lastMonthStart &&
            new Date(order.createdAt) <= lastMonthEnd,
        )

        const thisMonthSales = thisMonthOrders.reduce(
          (sum: number, order: any) => sum + (order.total || 0),
          0,
        )
        const lastMonthSales = lastMonthOrders.reduce(
          (sum: number, order: any) => sum + (order.total || 0),
          0,
        )
        const thisMonthCommission = thisMonthSales * (salesRepData.commissionRate / 100)
        const lastMonthCommission = lastMonthSales * (salesRepData.commissionRate / 100)

        setMetrics({
          totalSales,
          totalCommission,
          totalOrders,
          averageOrderValue,
          quotaProgress,
          thisMonthSales,
          thisMonthCommission,
          lastMonthSales,
          lastMonthCommission,
        })
      } catch (err) {
        console.error('Error fetching sales rep data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch sales rep data')
      } finally {
        setLoading(false)
      }
    }

    if (salesRepId) {
      fetchSalesRepData()
    }
  }, [salesRepId])

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const response = await fetch(`/api/salesReps/${salesRepId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update sales rep')
      }

      const updatedSalesRep = await response.json()
      setSalesRep(updatedSalesRep)
      setIsEditing(false)
      toast.success('Sales rep updated successfully')
    } catch (err) {
      console.error('Error updating sales rep:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update sales rep')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (salesRep) {
      setFormData({
        name: salesRep.name,
        email: salesRep.email,
        role: salesRep.role as 'rep',
        commissionRate: salesRep.commissionRate,
        targetQuota: salesRep.targetQuota,
        active: salesRep.active,
      })
    }
    setIsEditing(false)
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!salesRep) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>Sales rep not found</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{salesRep.name}</h1>
              <p className="text-zinc-400">
                {roleLabels[salesRep.role]} • {salesRep.active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/collections/salesReps/${salesRep.id}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View in CMS
              </Link>
            </Button>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sales Rep Information */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Sales Rep Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-zinc-300">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-zinc-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="role" className="text-zinc-300">
                      Role
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, role: value as any }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="commissionRate" className="text-zinc-300">
                      Commission Rate (%)
                    </Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.commissionRate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          commissionRate: parseFloat(e.target.value) || 0,
                        }))
                      }
                      disabled={!isEditing}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetQuota" className="text-zinc-300">
                      Target Quota ($)
                    </Label>
                    <Input
                      id="targetQuota"
                      type="number"
                      min="0"
                      value={formData.targetQuota}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          targetQuota: parseFloat(e.target.value) || 0,
                        }))
                      }
                      disabled={!isEditing}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                    disabled={!isEditing}
                    className="rounded border-zinc-700 bg-zinc-800"
                  />
                  <Label htmlFor="active" className="text-zinc-300">
                    Active
                  </Label>
                </div>

                <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Created:</span>
                    <span className="text-white ml-2">
                      {format(new Date(salesRep.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Last Updated:</span>
                    <span className="text-white ml-2">
                      {format(new Date(salesRep.updatedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Dealers and Orders */}
            <Tabs defaultValue="dealers" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border-zinc-800">
                <TabsTrigger value="dealers" className="data-[state=active]:bg-zinc-800">
                  Assigned Dealers ({dealers.length})
                </TabsTrigger>
                <TabsTrigger value="orders" className="data-[state=active]:bg-zinc-800">
                  Recent Orders ({orders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dealers" className="space-y-4">
                {dealers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dealers.map((dealer) => (
                      <DealerCard key={dealer.id} dealer={dealer} />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="text-center py-12">
                      <Building2 className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-white">No dealers assigned</h3>
                      <p className="text-zinc-400">
                        This sales rep doesn&apos;t have any dealers assigned yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                {orders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="text-center py-12">
                      <ShoppingCart className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-white">No orders yet</h3>
                      <p className="text-zinc-400">
                        No orders have been placed by this sales rep&apos;s dealers.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            {metrics && <PerformanceCard metrics={metrics} />}

            {/* Quick Stats */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Assigned Dealers</span>
                    <span className="text-white font-medium">{dealers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Active Dealers</span>
                    <span className="text-white font-medium">
                      {dealers.filter((d) => d.active).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Verified Dealers</span>
                    <span className="text-white font-medium">
                      {dealers.filter((d) => d.emailVerified).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Recent Orders</span>
                    <span className="text-white font-medium">{orders.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
