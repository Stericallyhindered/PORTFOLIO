'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Search, User, Mail, Phone, ChevronDown, ChevronUp, Info } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

// Custom hook for persistent customers settings
function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Load from localStorage on client side
    try {
      const saved = localStorage.getItem(`customers-${key}`)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch (error) {
      console.warn(`Failed to load customers setting ${key}:`, error)
    }
  }, [key])

  const setValue = (value: T) => {
    setState(value)
    // Save to localStorage on client side
    if (isClient) {
      try {
        localStorage.setItem(`customers-${key}`, JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to save customers setting ${key}:`, error)
      }
    }
  }

  return [state, setValue]
}

type Customer = {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  phone?: string
  stripeCustomerId: string
  createdAt: string
  shippingAddresses?: Array<{
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
    isDefault?: boolean
  }>
  billingAddresses?: Array<{
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
    isDefault?: boolean
  }>
}

type DateRange = '30' | '60' | '90' | '365' | 'all'
type CustomerType = 'all' | 'with-phone' | 'without-phone' | 'with-shipping' | 'without-shipping'

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
      <span className="text-sm text-zinc-400">Customer Registration:</span>
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

function CustomerTypeFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-400">Filter:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue>
            {value === 'all'
              ? 'All Customers'
              : value === 'with-phone'
                ? 'With Phone'
                : value === 'without-phone'
                  ? 'Without Phone'
                  : value === 'with-shipping'
                    ? 'With Shipping'
                    : 'Without Shipping'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Customers</SelectItem>
          <SelectItem value="with-phone">With Phone Number</SelectItem>
          <SelectItem value="without-phone">Without Phone Number</SelectItem>
          <SelectItem value="with-shipping">With Shipping Address</SelectItem>
          <SelectItem value="without-shipping">Without Shipping Address</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function CustomerCard({ customer }: { customer: Customer }) {
  const displayName =
    customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown'
  const hasShippingAddress = customer.shippingAddresses && customer.shippingAddresses.length > 0
  const defaultShippingAddress =
    customer.shippingAddresses?.find((addr) => addr.isDefault) || customer.shippingAddresses?.[0]

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 bg-zinc-900/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-800/50 backdrop-blur-sm px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-zinc-100">{displayName}</h3>
            <p className="text-sm text-zinc-400 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {customer.email}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          {customer.phone && (
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-200 border border-green-700 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Phone
            </div>
          )}
          {hasShippingAddress && (
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-700">
              Shipping Address
            </div>
          )}
          <Link
            href={`/admin/customers/orders?customer=${customer.id}`}
            className="px-3 py-1 rounded-full flex items-center justify-center text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>
      <div className="p-4 text-sm space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400">Customer ID:</span>
              <span className="font-medium text-zinc-100 font-mono text-xs">{customer.id}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400">Created:</span>
              <span className="font-medium text-zinc-100">{formatDate(customer.createdAt)}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Phone:</span>
                <span className="font-medium text-zinc-100">{customer.phone}</span>
              </div>
            )}
          </div>
          {defaultShippingAddress && (
            <div>
              <h4 className="text-zinc-400 text-xs font-medium mb-2">DEFAULT SHIPPING ADDRESS</h4>
              <div className="text-zinc-300 text-xs space-y-1">
                <div>{defaultShippingAddress.name}</div>
                <div>{defaultShippingAddress.line1}</div>
                {defaultShippingAddress.line2 && <div>{defaultShippingAddress.line2}</div>}
                <div>
                  {defaultShippingAddress.city}, {defaultShippingAddress.state}{' '}
                  {defaultShippingAddress.postalCode}
                </div>
                <div>{defaultShippingAddress.country}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminCustomers() {
  // Use persistent state for user preferences
  const [dateRange, setDateRange] = usePersistentState<DateRange>('dateRange', '30')
  const [customerTypeFilter, setCustomerTypeFilter] = usePersistentState<CustomerType>(
    'customerTypeFilter',
    'all',
  )
  const [searchQuery, setSearchQuery] = usePersistentState<string>('searchQuery', '')
  const [pageSize, setPageSize] = usePersistentState<number>('pageSize', 20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        setError(null)

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
          page: currentPage.toString(),
          limit: pageSize.toString(),
          sort: '-createdAt', // Sort by newest first
          ...(startDate && { 'where[createdAt][greater_than_equal]': startDate }),
          ...(endDate && { 'where[createdAt][less_than_equal]': endDate }),
        })

        const response = await fetch(`/api/customers?${queryParams}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) throw new Error('Failed to fetch customers')
        const data = await response.json()
        setCustomers(data.docs || [])
        setTotalCustomers(data.totalDocs || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [dateRange, currentPage, pageSize])

  // Apply client-side filtering to current page results
  const filteredCustomers = customers.filter((customer) => {
    // Apply search filter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      (customer.email || '').toLowerCase().includes(searchLower) ||
      (customer.name || '').toLowerCase().includes(searchLower) ||
      (customer.firstName || '').toLowerCase().includes(searchLower) ||
      (customer.lastName || '').toLowerCase().includes(searchLower) ||
      (customer.phone || '').toLowerCase().includes(searchLower)

    if (!matchesSearch) return false

    // Apply customer type filter
    switch (customerTypeFilter) {
      case 'with-phone':
        return !!customer.phone
      case 'without-phone':
        return !customer.phone
      case 'with-shipping':
        return customer.shippingAddresses && customer.shippingAddresses.length > 0
      case 'without-shipping':
        return !customer.shippingAddresses || customer.shippingAddresses.length === 0
      default:
        return true
    }
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
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Customers</h1>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <Info className="h-4 w-4" />
            <span>How this page works</span>
            {showHelp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showHelp && (
          <Card className="bg-blue-900/10 border-blue-800/50">
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-medium text-blue-200 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Customer Page Guide
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-300">Filters & Search</h4>
                  <div className="space-y-2 text-zinc-300">
                    <div>
                      <span className="font-medium text-blue-200">Customer Registration:</span>
                      <span className="ml-2">
                        Filters customers by when they first registered/signed up
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-200">Filter Dropdown:</span>
                      <span className="ml-2">
                        Filter by data completeness (phone numbers, shipping addresses)
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-200">Search Box:</span>
                      <span className="ml-2">Search by name, email, or phone number</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-blue-300">Customer Card Badges</h4>
                  <div className="space-y-2 text-zinc-300">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-200 border border-green-700 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone
                      </div>
                      <span>Customer provided a phone number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-700">
                        Shipping Address
                      </div>
                      <span>Customer has a saved shipping address</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
                        View Orders
                      </div>
                      <span>Click to see all orders for this customer</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-800/30">
                <p className="text-xs text-zinc-400">
                  💡 <strong>Tip:</strong> Use the page size selector (10, 20, 50, 100) to control
                  how many customers are shown per page. Your preferences are saved automatically.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
            <CustomerTypeFilter
              value={customerTypeFilter}
              onChange={(value) => setCustomerTypeFilter(value as CustomerType)}
            />
          </div>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        <div className="text-sm text-zinc-400">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalCustomers)} -{' '}
          {Math.min(currentPage * pageSize, totalCustomers)} of {totalCustomers} customers
          {dateRange !== 'all' && ` (Last ${dateRange} Days)`}
        </div>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-zinc-100">Customer List</h2>
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
            </div>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full bg-zinc-800" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">
                    No customers found matching your criteria
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <CustomerCard key={customer.id} customer={customer} />
                  ))
                )}
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-100 disabled:opacity-50 hover:bg-zinc-700 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage * pageSize >= totalCustomers}
                    className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-100 disabled:opacity-50 hover:bg-zinc-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
                <span className="text-sm text-zinc-400">
                  Page {currentPage} of {Math.ceil(totalCustomers / pageSize)}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
