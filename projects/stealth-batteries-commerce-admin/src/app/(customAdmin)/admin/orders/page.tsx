'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ChevronsUpDown, Search } from 'lucide-react'
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
import { Input } from '@/components/ui/input'

// Custom hook for persistent orders settings
function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Load from localStorage on client side
    try {
      const saved = localStorage.getItem(`orders-${key}`)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch (error) {
      console.warn(`Failed to load orders setting ${key}:`, error)
    }
  }, [key])

  const setValue = (value: T) => {
    setState(value)
    // Save to localStorage on client side
    if (isClient) {
      try {
        localStorage.setItem(`orders-${key}`, JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to save orders setting ${key}:`, error)
      }
    }
  }

  return [state, setValue]
}

type Order = {
  id: string
  orderNumber: string
  total: number
  createdAt: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
  isDropship?: boolean
  dropship?: boolean
  customer?: {
    email: string
  }
  dealer?: {
    name?: string
    companyName?: string
  }
}

type DateRange = '30' | '60' | '90' | '365' | 'all'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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

function StatusFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-400">Status:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>{value === 'all' ? 'All Statuses' : value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 bg-zinc-900/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-800/50 backdrop-blur-sm px-4 py-3 border-b border-zinc-800">
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-medium text-zinc-100 hover:text-zinc-300 transition-colors"
        >
          Order #{order.orderNumber}
        </Link>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <div className="flex items-center gap-2">
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
            <StatusUpdateDialog
              orderId={order.id}
              orderNumber={order.orderNumber}
              currentStatus={order.status}
              trigger={
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Update status</span>
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              }
            />
          </div>
          {order.dealer && (
            <div className="px-3 py-1 self-center rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-700">
              {`Dealer: ${order.dealer.companyName || order.dealer.name || 'Unknown'}`}
            </div>
          )}
          {(order.isDropship || order.dropship) && (
            <span className="px-3 py-1 self-center rounded-full text-xs font-medium bg-purple-900/50 text-purple-200 border border-purple-700">
              Dropship
            </span>
          )}
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
            <span className="font-medium text-zinc-100 truncate">{order.customer.email}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const [dateRange, setDateRange] = usePersistentState<DateRange>('dateRange', '30')
  const [statusFilter, setStatusFilter] = usePersistentState<string>('statusFilter', 'all')
  const [searchQuery, setSearchQuery] = usePersistentState<string>('searchQuery', '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
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

        // Build the query URL with all parameters
        const queryParams = new URLSearchParams({
          dealerId: 'all', // Get all orders
          startDate: startDate,
          endDate: endDate,
          ...(statusFilter !== 'all' && { status: statusFilter }),
        })

        const response = await fetch(`/api/orders?${queryParams}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) throw new Error('Failed to fetch orders')
        const data = await response.json()
        setOrders(data.docs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [dateRange, statusFilter])

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (order.orderNumber?.toString() || '').toLowerCase().includes(searchLower) ||
      (order.customer?.email || '').toLowerCase().includes(searchLower) ||
      (order.dealer?.companyName || '').toLowerCase().includes(searchLower) ||
      (order.dealer?.name || '').toLowerCase().includes(searchLower)
    )
  })

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto flex flex-col gap-6 pb-12">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-white">Orders</h1>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          </div>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full bg-zinc-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                No orders found matching your criteria
              </div>
            ) : (
              filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
