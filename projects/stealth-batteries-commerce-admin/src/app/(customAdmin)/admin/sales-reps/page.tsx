'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertCircle,
  Search,
  Users,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  Target,
  TrendingUp,
  ExternalLink,
  Edit,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { filterOrdersByAssignmentDate } from '@/utilities/filterOrdersByAssignmentDate'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Custom hook for persistent sales reps settings
function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Load from localStorage on client side
    try {
      const saved = localStorage.getItem(`sales-reps-${key}`)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch (error) {
      console.warn(`Failed to load sales reps setting ${key}:`, error)
    }
  }, [key])

  const setValue = (value: T) => {
    setState(value)
    // Save to localStorage on client side
    if (isClient) {
      try {
        localStorage.setItem(`sales-reps-${key}`, JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to save sales reps setting ${key}:`, error)
      }
    }
  }

  return [state, setValue]
}

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
  // Calculated fields
  assignedDealers?: number
  totalCommission?: number
  totalSales?: number
  ordersCount?: number
  quotaProgress?: number
}

interface SalesRepStats {
  totalSalesReps: number
  activeSalesReps: number
  totalCommission: number
  totalSales: number
  averageCommissionRate: number
  totalQuota: number
  quotaAchievement: number
}

type DateRange = '7' | '30' | '90' | '365' | 'all'
type StatusFilter = 'all' | 'active' | 'inactive'
type RoleFilter = 'all' | 'rep' | 'senior_rep' | 'manager' | 'director' | 'vp_sales'

const roleLabels = {
  rep: 'Sales Rep',
  senior_rep: 'Senior Rep',
  manager: 'Manager',
  director: 'Director',
  vp_sales: 'VP Sales',
}

function DateRangeSelector({
  value,
  onChange,
}: {
  value: DateRange
  onChange: (value: DateRange) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700">
        <SelectValue placeholder="Select date range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7">Last 7 days</SelectItem>
        <SelectItem value="30">Last 30 days</SelectItem>
        <SelectItem value="90">Last 90 days</SelectItem>
        <SelectItem value="365">Last year</SelectItem>
        <SelectItem value="all">All time</SelectItem>
      </SelectContent>
    </Select>
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
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
      </SelectContent>
    </Select>
  )
}

function RoleFilterSelector({
  value,
  onChange,
}: {
  value: RoleFilter
  onChange: (value: RoleFilter) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700">
        <SelectValue placeholder="Filter by role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Roles</SelectItem>
        <SelectItem value="rep">Sales Rep</SelectItem>
        <SelectItem value="senior_rep">Senior Rep</SelectItem>
        <SelectItem value="manager">Manager</SelectItem>
        <SelectItem value="director">Director</SelectItem>
        <SelectItem value="vp_sales">VP Sales</SelectItem>
      </SelectContent>
    </Select>
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
    <Select value={value.toString()} onValueChange={(v) => onChange(parseInt(v))}>
      <SelectTrigger className="w-[100px] bg-zinc-800 border-zinc-700">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="10">10</SelectItem>
        <SelectItem value="20">20</SelectItem>
        <SelectItem value="50">50</SelectItem>
        <SelectItem value="100">100</SelectItem>
      </SelectContent>
    </Select>
  )
}

function HelpSection() {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        <Info className="h-4 w-4" />
        <span>How this page works</span>
        {showHelp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showHelp && (
        <Card className="mt-4 bg-blue-900/10 border-blue-800/50">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-medium text-blue-200 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sales Reps Page Guide
            </h3>
            <div className="space-y-3 text-sm text-blue-100">
              <div>
                <strong>Overview:</strong> This page shows all sales representatives with their
                performance metrics, commission data, and assigned dealers.
              </div>
              <div>
                <strong>Stats Cards:</strong> The top cards show summary statistics including total
                sales reps, commission totals, and quota achievement.
              </div>
              <div>
                <strong>Filters:</strong> Use the date range, status, and role filters to narrow
                down the results. Search by name or email.
              </div>
              <div>
                <strong>Performance Metrics:</strong> Each sales rep shows assigned dealers count,
                total commission, sales volume, and quota progress.
              </div>
              <div>
                <strong>Actions:</strong> Click on a sales rep to view detailed information and edit
                admin-only fields like commission rates.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SalesRepCard({ salesRep }: { salesRep: SalesRep }) {
  const getStatusColor = (active: boolean) => {
    return active ? 'bg-green-500' : 'bg-red-500'
  }

  const getRoleColor = (role: string) => {
    const colors = {
      rep: 'bg-blue-500',
      senior_rep: 'bg-purple-500',
      manager: 'bg-orange-500',
      director: 'bg-pink-500',
      vp_sales: 'bg-yellow-500',
    }
    return colors[role as keyof typeof colors] || 'bg-gray-500'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const quotaProgress =
    salesRep.totalSales && salesRep.targetQuota
      ? (salesRep.totalSales / salesRep.targetQuota) * 100
      : 0

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white">{salesRep.name}</h3>
              <Badge className={`${getStatusColor(salesRep.active)} text-white`}>
                {salesRep.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Mail className="h-3 w-3" />
              <span>{salesRep.email}</span>
            </div>
          </div>
          <Badge className={`${getRoleColor(salesRep.role)} text-white`}>
            {roleLabels[salesRep.role]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-zinc-400 mb-1">Assigned Dealers</div>
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-zinc-400" />
              <span className="text-sm font-medium text-white">
                {salesRep.assignedDealers || 0}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-400 mb-1">Commission Rate</div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-zinc-400" />
              <span className="text-sm font-medium text-white">{salesRep.commissionRate}%</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-400 mb-1">Total Commission</div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-sm font-medium text-green-400">
                {formatCurrency(salesRep.totalCommission || 0)}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-400 mb-1">Total Sales</div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">
                {formatCurrency(salesRep.totalSales || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Quota Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400">Quota Progress</span>
            <span className="text-xs text-zinc-400">
              {quotaProgress.toFixed(1)}% of {formatCurrency(salesRep.targetQuota || 0)}
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                quotaProgress >= 100
                  ? 'bg-green-500'
                  : quotaProgress >= 75
                    ? 'bg-yellow-500'
                    : quotaProgress >= 50
                      ? 'bg-orange-500'
                      : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(quotaProgress, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild className="flex-1">
            <Link href={`/admin/sales-reps/${salesRep.id}`}>
              <Edit className="h-3 w-3 mr-1" />
              Manage
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/collections/salesReps/${salesRep.id}`} target="_blank">
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StatsCards({ stats }: { stats: SalesRepStats }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Sales Reps</p>
              <p className="text-2xl font-bold text-white">{stats.totalSalesReps}</p>
              <p className="text-xs text-green-400">{stats.activeSalesReps} active</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Commission</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalCommission)}
              </p>
              <p className="text-xs text-zinc-400">
                Avg {stats.averageCommissionRate.toFixed(1)}% rate
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Sales</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalSales)}</p>
              <p className="text-xs text-zinc-400">All sales reps combined</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Quota Achievement</p>
              <p className="text-2xl font-bold text-white">{stats.quotaAchievement.toFixed(1)}%</p>
              <p className="text-xs text-zinc-400">Target: {formatCurrency(stats.totalQuota)}</p>
            </div>
            <Target className="h-8 w-8 text-yellow-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminSalesReps() {
  // Use persistent state for user preferences
  const [dateRange, setDateRange] = usePersistentState<DateRange>('dateRange', '30')
  const [statusFilter, setStatusFilter] = usePersistentState<StatusFilter>('statusFilter', 'all')
  const [roleFilter, setRoleFilter] = usePersistentState<RoleFilter>('roleFilter', 'all')
  const [searchQuery, setSearchQuery] = usePersistentState<string>('searchQuery', '')
  const [pageSize, setPageSize] = usePersistentState<number>('pageSize', 20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [stats, setStats] = useState<SalesRepStats>({
    totalSalesReps: 0,
    activeSalesReps: 0,
    totalCommission: 0,
    totalSales: 0,
    averageCommissionRate: 0,
    totalQuota: 0,
    quotaAchievement: 0,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalSalesReps, setTotalSalesReps] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchSalesRepsData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Build where clause for filtering
        const where: any = {}

        // Status filter
        if (statusFilter !== 'all') {
          where.active = { equals: statusFilter === 'active' }
        }

        // Role filter
        if (roleFilter !== 'all') {
          where.role = { equals: roleFilter }
        }

        // Search functionality
        if (searchQuery) {
          where.or = [{ name: { contains: searchQuery } }, { email: { contains: searchQuery } }]
        }

        // Date range for commission/sales calculations
        let startDate = ''
        if (dateRange !== 'all') {
          const now = new Date()
          const daysAgo = new Date(now)
          daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange))
          startDate = daysAgo.toISOString()
        }

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
          where: JSON.stringify(where),
          sort: '-updatedAt',
          depth: '2',
        })

        const response = await fetch(`/api/salesReps?${params}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error('Failed to fetch sales reps')
        }

        const data = await response.json()
        const salesRepsData = data.docs || []

        // Calculate stats and metrics for each sales rep
        const enrichedSalesReps = await Promise.all(
          salesRepsData.map(async (salesRep: any) => {
            // Fetch dealers assigned to this sales rep
            const dealersResponse = await fetch(
              `/api/dealers?where=${JSON.stringify({ salesRep: { equals: salesRep.id } })}&limit=100`,
              {
                credentials: 'include',
              },
            )

            let assignedDealers = 0
            let dealerIds: any[] = []

            if (!dealersResponse.ok) {
              console.error(
                'Dealers API failed:',
                dealersResponse.status,
                dealersResponse.statusText,
              )
              assignedDealers = 0
              dealerIds = []
            } else {
              const dealersData = await dealersResponse.json()

              // Filter dealers to only include those actually assigned to this sales rep
              const validDealers = dealersData.docs.filter((dealer: any) => {
                return dealer.salesRep === salesRep.id
              })

              assignedDealers = validDealers.length
              dealerIds = validDealers.map((dealer: any) => dealer.id)
            }

            // Fetch orders for commission calculation
            let orders: any[] = []
            if (dealerIds.length > 0) {
              // The custom orders API doesn't support multiple dealer IDs in one call
              // So we'll need to make separate calls for each dealer and combine results
              const allOrders: any[] = []

              for (const dealerId of dealerIds) {
                const params = new URLSearchParams({
                  dealerId: dealerId.toString(),
                })

                if (startDate) {
                  params.append('startDate', startDate)
                }

                try {
                  const response = await fetch(`/api/orders?${params}`, {
                    credentials: 'include',
                  })

                  if (response.ok) {
                    const data = await response.json()
                    if (data.orders) {
                      allOrders.push(...data.orders)
                    }
                  }
                } catch (error) {
                  console.error('Error fetching orders for dealer', dealerId, ':', error)
                }
              }

              orders = allOrders
            }

            // Filter orders to only include those placed after assignment dates
            const filteredOrders = filterOrdersByAssignmentDate(orders, salesRep.id)

            // Calculate totals
            const totalSales = filteredOrders.reduce(
              (sum: number, order: any) => sum + (order.total || 0),
              0,
            )
            const totalCommission = filteredOrders.reduce(
              (sum: number, order: any) =>
                sum + ((order.dealerTotal || 0) * (salesRep.commissionRate || 0)) / 100,
              0,
            )

            return {
              ...salesRep,
              assignedDealers,
              totalSales,
              totalCommission,
              ordersCount: filteredOrders.length,
              quotaProgress: salesRep.targetQuota ? (totalSales / salesRep.targetQuota) * 100 : 0,
            }
          }),
        )

        setSalesReps(enrichedSalesReps)
        setTotalSalesReps(data.totalDocs || 0)
        setTotalPages(data.totalPages || 1)

        // Calculate summary stats
        const totalSalesRepsCount = enrichedSalesReps.length
        const activeSalesRepsCount = enrichedSalesReps.filter((rep) => rep.active).length
        const totalCommissionSum = enrichedSalesReps.reduce(
          (sum, rep) => sum + (rep.totalCommission || 0),
          0,
        )
        const totalSalesSum = enrichedSalesReps.reduce((sum, rep) => sum + (rep.totalSales || 0), 0)
        const averageCommissionRate =
          totalSalesRepsCount > 0
            ? enrichedSalesReps.reduce((sum, rep) => sum + rep.commissionRate, 0) /
              totalSalesRepsCount
            : 0
        const totalQuotaSum = enrichedSalesReps.reduce(
          (sum, rep) => sum + (rep.targetQuota || 0),
          0,
        )
        const quotaAchievement = totalQuotaSum > 0 ? (totalSalesSum / totalQuotaSum) * 100 : 0

        setStats({
          totalSalesReps: totalSalesRepsCount,
          activeSalesReps: activeSalesRepsCount,
          totalCommission: totalCommissionSum,
          totalSales: totalSalesSum,
          averageCommissionRate,
          totalQuota: totalQuotaSum,
          quotaAchievement,
        })
      } catch (err) {
        console.error('Error fetching sales reps:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch sales reps')
      } finally {
        setLoading(false)
      }
    }

    fetchSalesRepsData()
  }, [dateRange, statusFilter, roleFilter, searchQuery, currentPage, pageSize])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (type: string, value: string) => {
    if (type === 'status') {
      setStatusFilter(value as StatusFilter)
    } else if (type === 'role') {
      setRoleFilter(value as RoleFilter)
    }
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Sales Representatives</h1>
            <p className="text-zinc-400">
              Manage sales reps, commission rates, and performance metrics
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/collections/salesReps/create">
              <Users className="h-4 w-4 mr-2" />
              Add Sales Rep
            </Link>
          </Button>
        </div>

        <HelpSection />

        <StatsCards stats={stats} />

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
            <StatusFilterSelector
              value={statusFilter}
              onChange={(value) => handleFilterChange('status', value)}
            />
            <RoleFilterSelector
              value={roleFilter}
              onChange={(value) => handleFilterChange('role', value)}
            />
            <PageSizeSelector value={pageSize} onChange={handlePageSizeChange} />
          </div>

          <div className="flex-1 lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search sales reps..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-zinc-400">
            {loading
              ? 'Loading sales reps...'
              : `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalSalesReps)} of ${totalSalesReps} sales reps`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesReps.map((salesRep) => (
              <SalesRepCard key={salesRep.id} salesRep={salesRep} />
            ))}
          </div>
        )}

        {salesReps.length === 0 && !loading && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No sales reps found</h3>
              <p className="text-zinc-400 mb-4">
                {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'Try adjusting your filters or search query.'
                  : 'No sales representatives have been created yet.'}
              </p>
              <Button asChild>
                <Link href="/admin/collections/salesReps/create">
                  <Users className="h-4 w-4 mr-2" />
                  Add First Sales Rep
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-zinc-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
