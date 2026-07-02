'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import '@/app/(frontend)/globals.css'
import { useTheme } from '@payloadcms/ui'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatusUpdateDialog } from '@/app/components/shared/StatusUpdateDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Custom hook for persistent dashboard settings
function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Load from localStorage on client side
    try {
      const saved = localStorage.getItem(`dashboard-${key}`)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch (error) {
      console.warn(`Failed to load dashboard setting ${key}:`, error)
    }
  }, [key])

  const setValue = (value: T) => {
    setState(value)
    // Save to localStorage on client side
    if (isClient) {
      try {
        localStorage.setItem(`dashboard-${key}`, JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to save dashboard setting ${key}:`, error)
      }
    }
  }

  return [state, setValue]
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type DashboardStats = {
  totalOrders: number
  totalRevenue: number
  processingOrders: number
  completedOrders: number
  preOrders: number
  totalCustomers: number
  totalDealers: number
  totalProducts: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    total: number
    createdAt: string
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
    isDropship?: boolean
    dropship?: boolean
    customer?: {
      email: string
      firstName: string
      lastName: string
    }
    shippingAddress?: {
      line1: string
      line2: string
      city: string
      state: string
      postalCode: string
      country: string
    }
    dealer?: {
      name?: string
      companyName?: string
    }
    items: Array<{
      title: string
      quantity: number
      product?: {
        modelNumber?: string
      }
    }>
  }>
}

type DateRange = '30' | '60' | '90' | '365' | 'all'

function DateRangeSelector({
  value,
  onChange,
}: {
  value: DateRange
  onChange: (value: DateRange) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-400">Time Range:</span>
      <Select value={value} onValueChange={(value) => onChange(value as DateRange)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>{value === 'all' ? 'All Time' : `Last ${value} Days`}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30">Last 30 Days</SelectItem>
          <SelectItem value="60">Last 60 Days</SelectItem>
          <SelectItem value="90">Last 90 Days</SelectItem>
          <SelectItem value="365">Last Year</SelectItem>
          <SelectItem value="all">All Time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string
  value: string | number
  color?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-200 bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${color || 'text-white'}`}>{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function OrderCard({ order }: { order: DashboardStats['recentOrders'][0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="border border-zinc-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 bg-zinc-900/50"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-800/50 backdrop-blur-sm px-4 py-3 border-b border-zinc-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-2 px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
            >
              Order #{order.orderNumber}
            </Link>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                order.status.toLowerCase() === 'processing'
                  ? 'bg-amber-900/50 text-amber-200 border border-amber-700'
                  : order.status.toLowerCase() === 'completed'
                    ? 'bg-green-900/50 text-green-200 border border-green-700'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
              }`}
            >
              {order.status}
            </span>
            {order.dealer && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-700">
                {`Dealer: ${order.dealer.companyName || order.dealer.name || 'Unknown'}`}
              </div>
            )}
            {(order.isDropship || order.dropship) && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-200 border border-purple-700">
                Dropship
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex items-center gap-2 px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
          >
            View Details
          </Link>
          <StatusUpdateDialog
            orderId={order.id}
            orderNumber={order.orderNumber}
            currentStatus={order.status}
            trigger={
              <Button variant="outline" size="default" className="flex items-center gap-2">
                <span>Update Status</span>
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>
      <div className="p-4 text-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Total:</span>
          <span className="font-medium text-zinc-100">${order.total.toFixed(2)}</span>
        </div>
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between">
          <span className="text-zinc-400">Date:</span>
          <span className="font-medium text-zinc-100">{formatDate(order.createdAt)}</span>
        </div>
        {order.customer && (
          <div className="flex flex-row flex-wrap gap-2 items-center justify-between">
            <span className="text-zinc-400">Customer:</span>
            <span className="font-medium text-zinc-100 truncate text-right">
              {order.customer.firstName} {order.customer.lastName}
              <br /> {order.customer.email}
              <br />{' '}
              {order.shippingAddress?.city
                ? `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`
                : 'No shipping address'}
            </span>
          </div>
        )}
        {order.items && order.items.length > 0 && (
          <div className="mt-4 space-y-2">
            <span className="text-zinc-400">Items:</span>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-zinc-100">
                        {item.title}
                        {item.product?.modelNumber && (
                          <span className="block text-xs text-zinc-400">
                            Model: {item.product.modelNumber}
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-zinc-400">x{item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const DashboardTailwind: React.FC = () => {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null)
  // Use persistent state for user preferences
  const [dateRange, setDateRange] = usePersistentState<DateRange>('dateRange', '30')
  const [pageSize, setPageSize] = usePersistentState<number>('pageSize', 10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    processingOrders: 0,
    completedOrders: 0,
    preOrders: 0,
    totalCustomers: 0,
    totalDealers: 0,
    totalProducts: 0,
    recentOrders: [],
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the current session user
        const userRes = await fetch('/api/users/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        })

        if (!userRes.ok) {
          throw new Error('Failed to fetch user')
        }

        const userData = await userRes.json()
        setUser(userData.user || userData)

        // Calculate date range for filtering
        let startDate = ''
        let endDate = ''
        if (dateRange !== 'all') {
          const now = new Date()
          const daysAgo = new Date(now)
          daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange))
          daysAgo.setHours(0, 0, 0, 0)
          now.setHours(23, 59, 59, 999)

          startDate = daysAgo.toISOString()
          endDate = now.toISOString()
        }

        // Fetch orders with date filtering
        const ordersRes = await fetch(
          `/api/orders?dealerId=all&page=${currentPage}&limit=${pageSize}${
            startDate ? `&startDate=${encodeURIComponent(startDate)}` : ''
          }${endDate ? `&endDate=${encodeURIComponent(endDate)}` : ''}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
            },
          },
        )

        if (!ordersRes.ok) {
          throw new Error('Failed to fetch orders')
        }

        const ordersData = await ordersRes.json()

        // Calculate stats from filtered orders
        const filteredOrders = ordersData.docs || []
        const totalRevenue = filteredOrders.reduce(
          (sum: number, order: any) => sum + (order.total || 0),
          0,
        )
        const processingOrders = filteredOrders.filter(
          (order: any) => order.status === 'processing',
        ).length
        const completedOrders = filteredOrders.filter(
          (order: any) => order.status === 'completed',
        ).length
        const preOrders = filteredOrders.filter((order: any) => order.status === 'pre-order').length

        setStats({
          totalOrders: ordersData.totalDocs || 0,
          totalRevenue,
          processingOrders,
          completedOrders,
          preOrders,
          totalCustomers: 0, // These will be set by separate API calls below
          totalDealers: 0,
          totalProducts: 0,
          recentOrders: filteredOrders,
        })
        setTotalOrders(ordersData.totalDocs || 0)

        // Fetch other data as before...
        const [customersRes, dealersRes, productsRes] = await Promise.all([
          fetch('/api/customers?limit=0', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch('/api/dealers?limit=0', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch('/api/products?limit=0', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
        ])

        const [customersData, dealersData, productsData] = await Promise.all([
          customersRes.json(),
          dealersRes.json(),
          productsRes.json(),
        ])

        setStats({
          totalOrders: ordersData.totalDocs || 0,
          totalRevenue,
          processingOrders,
          completedOrders,
          preOrders,
          totalCustomers: customersData?.totalDocs || 0,
          totalDealers: dealersData?.totalDocs || 0,
          totalProducts: productsData?.totalDocs || 0,
          recentOrders: filteredOrders,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, currentPage, pageSize])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="h-8 w-64">
          <Skeleton className="h-full w-full bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <Card key={i} className="w-full bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 bg-zinc-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <p className="mt-2">Please try refreshing the page.</p>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl text-zinc-400">
            {user?.name ? `Welcome back, ${user.name}` : 'Welcome to the dashboard'}
          </h2>
          <DateRangeSelector value={dateRange} onChange={(value) => setDateRange(value)} />
        </div>
      </motion.div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`Total Orders ${dateRange === 'all' ? '(All Time)' : `(Last ${dateRange} Days)`}`}
            value={stats.totalOrders}
            color="text-white"
          />
          <StatCard
            title={`Pre-Orders ${dateRange === 'all' ? '(All Time)' : `(Last ${dateRange} Days)`}`}
            value={stats.preOrders}
            color="text-blue-400"
          />
          <StatCard
            title={`Processing Orders ${dateRange === 'all' ? '(All Time)' : `(Last ${dateRange} Days)`}`}
            value={stats.processingOrders}
            color="text-amber-400"
          />
          <StatCard
            title={`Completed Orders ${dateRange === 'all' ? '(All Time)' : `(Last ${dateRange} Days)`}`}
            value={stats.completedOrders}
            color="text-emerald-400"
          />

          <StatCard title="Total Customers" value={stats.totalCustomers} color="text-blue-400" />
          <StatCard title="Total Dealers" value={stats.totalDealers} color="text-purple-400" />
          <StatCard title="Total Products" value={stats.totalProducts} color="text-indigo-400" />
          <StatCard
            title={`Total Revenue ${dateRange === 'all' ? '(All Time)' : `(Last ${dateRange} Days)`}`}
            value={`$${stats.totalRevenue.toFixed(2)}`}
            color="text-white"
          />
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <div className="flex justify-between items-center">
              <CardTitle className="text-zinc-100">Recent Orders</CardTitle>
              <div className="flex items-center gap-4">
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value))
                    setCurrentPage(1) // Reset to first page when changing page size
                  }}
                >
                  <SelectTrigger className="w-[120px] bg-zinc-800 text-zinc-100 border-zinc-700">
                    <SelectValue>Show {pageSize}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        Show {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-zinc-400">
                  {dateRange === 'all' ? 'All Time' : `Last ${dateRange} Days`}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4">
              {stats.recentOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage * pageSize >= totalOrders}
                  className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <span className="text-sm text-zinc-400">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalOrders)} -{' '}
                {Math.min(currentPage * pageSize, totalOrders)} of {totalOrders} orders
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardTailwind
