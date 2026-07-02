'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertCircle,
  Search,
  Building2,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Info,
  Shield,
  MapPin,
  Check,
  X,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

// Custom hook for persistent dealers settings
function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Load from localStorage on client side
    try {
      const saved = localStorage.getItem(`dealers-${key}`)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch (error) {
      console.warn(`Failed to load dealers setting ${key}:`, error)
    }
  }, [key])

  const setValue = (value: T) => {
    setState(value)
    // Save to localStorage on client side
    if (isClient) {
      try {
        localStorage.setItem(`dealers-${key}`, JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to save dealers setting ${key}:`, error)
      }
    }
  }

  return [state, setValue]
}

type Dealer = {
  id: string
  companyName: string
  contactName: string
  email: string
  phoneNumber: string
  verified?: boolean
  _verified?: boolean
  taxExempt?: boolean
  useShippingAddress?: boolean
  createdAt: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
  }
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
  }
  discountTier?: {
    id: string
    name: string
    discountPercent: number
  }
}

type DateRange = '30' | '60' | '90' | '365' | 'all'
type StatusFilter = 'all' | 'verified' | 'unverified' | 'tax-exempt' | 'with-shipping'

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
      <span className="text-sm text-zinc-400">Dealer Registration:</span>
      <Select value={value} onValueChange={(value) => onChange(value as DateRange)}>
        <SelectTrigger className="w-[160px] px-3 py-2">
          <SelectValue>{value === 'all' ? 'All Time' : `Last ${value} Days`}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          <SelectItem value="30" className="pl-8 pr-3 py-2">
            Last 30 Days
          </SelectItem>
          <SelectItem value="60" className="pl-8 pr-3 py-2">
            Last 60 Days
          </SelectItem>
          <SelectItem value="90" className="pl-8 pr-3 py-2">
            Last 90 Days
          </SelectItem>
          <SelectItem value="365" className="pl-8 pr-3 py-2">
            Last Year
          </SelectItem>
          <SelectItem value="all" className="pl-8 pr-3 py-2">
            All Time
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function StatusFilterSelector({
  value,
  onChange,
}: {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-400">Status:</span>
      <Select value={value} onValueChange={(value) => onChange(value as StatusFilter)}>
        <SelectTrigger className="w-[180px] px-3 py-2">
          <SelectValue>
            {value === 'all'
              ? 'All Dealers'
              : value === 'verified'
                ? 'Admin Approved'
                : value === 'unverified'
                  ? 'Pending Approval'
                  : value === 'tax-exempt'
                    ? 'Tax Exempt'
                    : 'With Shipping'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          <SelectItem value="all" className="pl-8 pr-3 py-2">
            All Dealers
          </SelectItem>
          <SelectItem value="verified" className="pl-8 pr-3 py-2">
            Admin Approved
          </SelectItem>
          <SelectItem value="unverified" className="pl-8 pr-3 py-2">
            Pending Approval
          </SelectItem>
          <SelectItem value="tax-exempt" className="pl-8 pr-3 py-2">
            Tax Exempt
          </SelectItem>
          <SelectItem value="with-shipping" className="pl-8 pr-3 py-2">
            Separate Shipping Address
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function PageSizeSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-400">Show:</span>
      <Select value={value.toString()} onValueChange={(value) => onChange(parseInt(value))}>
        <SelectTrigger className="w-[90px] px-3 py-2">
          <SelectValue>{value}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          <SelectItem value="10" className="pl-8 pr-3 py-2">
            10
          </SelectItem>
          <SelectItem value="20" className="pl-8 pr-3 py-2">
            20
          </SelectItem>
          <SelectItem value="50" className="pl-8 pr-3 py-2">
            50
          </SelectItem>
          <SelectItem value="100" className="pl-8 pr-3 py-2">
            100
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function DealerCard({ dealer }: { dealer: Dealer }) {
  const hasShippingAddress = dealer.useShippingAddress && dealer.shippingAddress

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 bg-zinc-900/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center bg-zinc-800/50 backdrop-blur-sm px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-zinc-100">{dealer.companyName}</h3>
            <p className="text-sm text-zinc-400">{dealer.contactName}</p>
            <p className="text-sm text-zinc-400 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {dealer.email}
            </p>
            <div className="mt-1">
              {dealer._verified ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-green-900/30 text-green-300 border border-green-700/50">
                  <Check className="h-2 w-2" />
                  Email Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-900/30 text-amber-300 border border-amber-700/50">
                  <X className="h-2 w-2" />
                  Email Unverified
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 sm:mt-0 sm:ml-4 w-full sm:w-auto justify-start sm:justify-end">
          {dealer.verified ? (
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-200 border border-green-700 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Approved
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-200 border border-red-700 flex items-center gap-1">
              <X className="h-3 w-3" />
              Pending Approval
            </div>
          )}
          {dealer.taxExempt && (
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-700 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Tax Exempt
            </div>
          )}
          {hasShippingAddress && (
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-200 border border-purple-700 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Separate Shipping
            </div>
          )}
          <Link
            href={`/admin/dealers/orders?dealer=${dealer.id}`}
            className="px-3 py-1 rounded-full flex items-center justify-center text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          >
            View Orders
          </Link>
          <Link
            href={`/admin/collections/dealers/${dealer.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-full flex items-center justify-center gap-1 text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Edit
          </Link>
        </div>
      </div>
      <div className="p-4 text-sm space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-zinc-400 mb-1">Contact Information</p>
            <div className="space-y-1">
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-zinc-500" />
                <span>{dealer.phoneNumber}</span>
              </p>
            </div>
          </div>
          <div>
            <p className="text-zinc-400 mb-1">Address</p>
            <div className="text-zinc-300 text-xs">
              <p>{dealer.address.line1}</p>
              {dealer.address.line2 && <p>{dealer.address.line2}</p>}
              <p>
                {dealer.address.city}, {dealer.address.state} {dealer.address.zip}
              </p>
            </div>
          </div>
        </div>
        {dealer.discountTier && (
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-zinc-400 text-xs">
              Discount Tier:{' '}
              <span className="text-primary font-medium">
                {dealer.discountTier.name} ({dealer.discountTier.discountPercent}%)
              </span>
            </p>
          </div>
        )}
        <div className="pt-2 border-t border-zinc-800">
          <p className="text-zinc-400 text-xs">Registered: {formatDate(dealer.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}

function HelpSection() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        <Info className="h-4 w-4" />
        How this page works
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isExpanded && (
        <Card className="mt-3 bg-blue-950/20 border-blue-800/30">
          <div className="p-4 space-y-3 text-sm">
            <div>
              <h4 className="font-medium text-blue-200 mb-1">Filters & Search</h4>
              <ul className="text-blue-100/80 space-y-1 text-xs ml-2">
                <li>
                  • <strong>Dealer Registration:</strong> Filter by when dealers registered (last
                  30/60/90/365 days or all time)
                </li>
                <li>
                  • <strong>Status Filter:</strong> Show all dealers, only admin approved, pending
                  admin approval, tax exempt, or with separate shipping addresses
                </li>
                <li>
                  • <strong>Search:</strong> Search by company name, contact name, email, or phone
                  number
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-blue-200 mb-1">Dealer Card Badges</h4>
              <ul className="text-blue-100/80 space-y-1 text-xs ml-2">
                <li>
                  •{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-900/50 text-green-200 border border-green-700">
                    <Check className="h-2 w-2" />
                    Approved
                  </span>{' '}
                  - Dealer is approved by admin and can access the system
                </li>
                <li>
                  •{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-900/50 text-red-200 border border-red-700">
                    <X className="h-2 w-2" />
                    Pending Approval
                  </span>{' '}
                  - Dealer awaiting admin approval
                </li>
                <li>
                  •{' '}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-green-900/30 text-green-300 border border-green-700/50">
                    <Check className="h-2 w-2" />
                    Email Verified
                  </span>{' '}
                  - Dealer has verified their email address
                </li>
                <li>
                  •{' '}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-900/30 text-amber-300 border border-amber-700/50">
                    <X className="h-2 w-2" />
                    Email Unverified
                  </span>{' '}
                  - Dealer has not yet verified their email address
                </li>
                <li>
                  •{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-900/50 text-blue-200 border border-blue-700">
                    <Shield className="h-2 w-2" />
                    Tax Exempt
                  </span>{' '}
                  - Dealer has tax exemption status
                </li>
                <li>
                  •{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-900/50 text-purple-200 border border-purple-700">
                    <MapPin className="h-2 w-2" />
                    Separate Shipping
                  </span>{' '}
                  - Uses different shipping address
                </li>
                <li>
                  • <strong>View Orders</strong> button - Click to see all orders placed by this
                  dealer
                </li>
                <li>
                  • <strong>Edit</strong> button - Opens the Payload admin interface to edit dealer
                  details
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-blue-800/30">
              <p className="text-blue-100/70 text-xs">
                <strong>Pro tip:</strong> Your filter preferences and page size selection are
                automatically saved and will persist when you return to this page.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default function AdminDealers() {
  const [dateRange, setDateRange] = usePersistentState<DateRange>('dateRange', '365')
  const [statusFilter, setStatusFilter] = usePersistentState<StatusFilter>('statusFilter', 'all')
  const [searchQuery, setSearchQuery] = usePersistentState<string>('searchQuery', '')
  const [pageSize, setPageSize] = usePersistentState<number>('pageSize', 20)
  const [currentPage, setCurrentPage] = useState(1)

  const [dealers, setDealers] = useState<Dealer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalDealers, setTotalDealers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Build where clause for Payload API
        const where: any = {}

        // Add date filtering if dates are provided
        if (dateRange !== 'all') {
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(endDate.getDate() - parseInt(dateRange))
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)

          where.createdAt = {
            greater_than_equal: startDate.toISOString(),
            less_than_equal: endDate.toISOString(),
          }
        }

        // Add search filtering
        if (searchQuery.trim()) {
          where.or = [
            { companyName: { contains: searchQuery.trim() } },
            { contactName: { contains: searchQuery.trim() } },
            { email: { contains: searchQuery.trim() } },
            { phoneNumber: { contains: searchQuery.trim() } },
          ]
        }

        // Add status filtering
        if (statusFilter && statusFilter !== 'all') {
          if (statusFilter === 'verified') {
            where.verified = { equals: true }
          } else if (statusFilter === 'unverified') {
            where.verified = { equals: false }
          } else if (statusFilter === 'tax-exempt') {
            where.taxExempt = { equals: true }
          } else if (statusFilter === 'with-shipping') {
            where.useShippingAddress = { equals: true }
          }
        }

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
          where: JSON.stringify(where),
          sort: '-createdAt',
          depth: '1',
        })

        const response = await fetch(`/api/dealers?${params.toString()}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch dealers: ${response.statusText}`)
        }

        const data = await response.json()
        setDealers(data.docs || [])
        setTotalDealers(data.totalDocs || 0)
        setTotalPages(data.totalPages || 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDealers()
  }, [dateRange, statusFilter, searchQuery, currentPage, pageSize])

  // Reset to page 1 when changing page size
  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalDealers)

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Dealers</h1>
        </div>

        <HelpSection />

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
            <StatusFilterSelector value={statusFilter} onChange={setStatusFilter} />
            <PageSizeSelector value={pageSize} onChange={setPageSize} />
          </div>

          <div className="flex-1 lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search dealers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
              />
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-950/50 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-zinc-400">
            {isLoading
              ? 'Loading dealers...'
              : `Showing ${startIndex}-${endIndex} of ${totalDealers} dealers (Page ${currentPage} of ${totalPages})`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: pageSize }).map((_, i) => (
              <Skeleton key={i} className="h-48 bg-zinc-800" />
            ))}
          </div>
        ) : dealers.length === 0 ? (
          <Card className="p-8 text-center bg-zinc-900 border-zinc-800">
            <Building2 className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">No dealers found</h3>
            <p className="text-zinc-500">
              {searchQuery || statusFilter !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'No dealers have been registered yet.'}
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {dealers.map((dealer) => (
                <DealerCard key={dealer.id} dealer={dealer} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
