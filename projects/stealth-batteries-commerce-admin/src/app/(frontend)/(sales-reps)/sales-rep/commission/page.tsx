import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Target,
  Users,
  ShoppingCart,
  Building2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { filterOrdersByAssignmentDate } from '@/utilities/filterOrdersByAssignmentDate'
import Link from 'next/link'
import { CommissionExplainer } from '@/components/CommissionExplainer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Commission Page',
  description: 'Commission Page for Sales Reps',
}

async function getSalesRepData() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    redirect('/sales-rep-login')
  }

  const salesRepResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/salesReps/me`, {
    headers: {
      Authorization: `JWT ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    credentials: 'include',
  })

  if (!salesRepResponse.ok) {
    if (
      salesRepResponse.status === 401 ||
      salesRepResponse.status === 403 ||
      salesRepResponse.status === 404
    ) {
      redirect('/sales-rep-login')
    }
    throw new Error(`Failed to fetch sales rep data: ${salesRepResponse.status}`)
  }

  const data = await salesRepResponse.json()

  if (!data.user) {
    redirect('/sales-rep-login')
  }

  if (!data.user.active) {
    redirect('/sales-rep-login')
  }

  return data.user
}

async function getAssignedDealers(salesRepId: string | number) {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    redirect('/sales-rep-login')
  }

  const parsedSalesRepId = typeof salesRepId === 'string' ? parseInt(salesRepId, 10) : salesRepId
  if (isNaN(parsedSalesRepId)) {
    throw new Error('Invalid sales rep ID')
  }

  const dealersResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers?where[salesRep][equals]=${parsedSalesRepId}&depth=2`,
    {
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      credentials: 'include',
    },
  )

  if (!dealersResponse.ok) {
    if (
      dealersResponse.status === 401 ||
      dealersResponse.status === 403 ||
      dealersResponse.status === 404
    ) {
      redirect('/sales-rep-login')
    }
    throw new Error(`Failed to fetch dealers: ${dealersResponse.status}`)
  }

  const data = await dealersResponse.json()
  return data.docs || []
}

async function getDealerOrders(salesRepId: string | number, assignedDealers: any[]) {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    redirect('/sales-rep-login')
  }

  // If no dealers are assigned, return empty array immediately
  if (assignedDealers.length === 0) {
    return []
  }

  // Get orders for each dealer using the custom orders API
  const allOrders: any[] = []
  const dealerIds = assignedDealers.map((dealer: any) => dealer.id)

  for (const dealerId of dealerIds) {
    try {
      const ordersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders?dealerId=${dealerId}&limit=500`,
        {
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          credentials: 'include',
        },
      )

      if (ordersResponse.ok) {
        const data = await ordersResponse.json()
        if (data.docs && Array.isArray(data.docs)) {
          allOrders.push(...data.docs)
        }
      }
    } catch (error) {
      console.error(`Error fetching orders for dealer ${dealerId}:`, error)
    }
  }

  // Sort by creation date (newest first)
  return allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function calculatePeriodMetrics(
  orders: any[],
  startDate: Date,
  endDate: Date,
  commissionRate: number,
  calculationMethod: 'all_orders' | 'completed_orders' = 'completed_orders',
) {
  const periodOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt)
    const isInPeriod = orderDate >= startDate && orderDate <= endDate

    // Apply status filter based on calculation method
    if (calculationMethod === 'completed_orders') {
      return isInPeriod && order.status === 'completed'
    }

    return isInPeriod
  })

  const totalSales = periodOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalCommission = totalSales * (commissionRate / 100)
  const orderCount = periodOrders.length

  return {
    totalSales,
    totalCommission,
    orderCount,
    averageOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
  }
}

function getCommissionByDealer(
  orders: any[],
  dealers: any[],
  commissionRate: number,
  calculationMethod: 'all_orders' | 'completed_orders' = 'completed_orders',
) {
  return dealers
    .map((dealer) => {
      const dealerOrders = orders.filter((order) => {
        const orderDealerId = typeof order.dealer === 'object' ? order.dealer?.id : order.dealer
        const isForDealer = orderDealerId === dealer.id

        // Apply status filter based on calculation method
        if (calculationMethod === 'completed_orders') {
          return isForDealer && order.status === 'completed'
        }

        return isForDealer
      })

      const totalSales = dealerOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      const commission = totalSales * (commissionRate / 100)

      return {
        dealer,
        totalSales,
        commission,
        orderCount: dealerOrders.length,
      }
    })
    .sort((a, b) => b.commission - a.commission)
}

export default async function CommissionPage() {
  const salesRep = await getSalesRepData()
  const assignedDealers = await getAssignedDealers(salesRep.id)
  const allOrdersRaw = await getDealerOrders(salesRep.id, assignedDealers)

  // Filter orders to only include those placed after assignment dates
  const allOrders = filterOrdersByAssignmentDate(allOrdersRaw, salesRep.id)

  // Get the sales rep's commission calculation method (default to completed_orders if not set)
  const calculationMethod = salesRep.commissionCalculationMethod || 'completed_orders'

  // Calculate different time periods
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const currentYearStart = new Date(now.getFullYear(), 0, 1)
  const last30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Calculate metrics for different periods
  const allTimeMetrics = calculatePeriodMetrics(
    allOrders,
    new Date(0),
    now,
    salesRep.commissionRate,
    calculationMethod,
  )
  const currentMonthMetrics = calculatePeriodMetrics(
    allOrders,
    currentMonthStart,
    now,
    salesRep.commissionRate,
    calculationMethod,
  )
  const lastMonthMetrics = calculatePeriodMetrics(
    allOrders,
    lastMonthStart,
    lastMonthEnd,
    salesRep.commissionRate,
    calculationMethod,
  )
  const currentYearMetrics = calculatePeriodMetrics(
    allOrders,
    currentYearStart,
    now,
    salesRep.commissionRate,
    calculationMethod,
  )
  const last30DaysMetrics = calculatePeriodMetrics(
    allOrders,
    last30DaysStart,
    now,
    salesRep.commissionRate,
    calculationMethod,
  )

  // Calculate month-over-month growth
  const monthOverMonthGrowth =
    lastMonthMetrics.totalCommission > 0
      ? ((currentMonthMetrics.totalCommission - lastMonthMetrics.totalCommission) /
          lastMonthMetrics.totalCommission) *
        100
      : 0

  // Get commission breakdown by dealer
  const commissionByDealer = getCommissionByDealer(
    allOrders,
    assignedDealers,
    salesRep.commissionRate,
    calculationMethod,
  )

  // Calculate quota progress
  const quotaProgress =
    salesRep.targetQuota > 0 ? (currentMonthMetrics.totalSales / salesRep.targetQuota) * 100 : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Commission Dashboard</h1>
          <Badge variant={calculationMethod === 'completed_orders' ? 'default' : 'secondary'}>
            {calculationMethod === 'completed_orders'
              ? 'Completed Orders Only'
              : 'All Orders (Legacy)'}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Track your commission earnings and sales performance across all periods.
          {calculationMethod === 'completed_orders'
            ? ' Commission is calculated only on completed/shipped orders.'
            : ' Commission is calculated on all orders regardless of status.'}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${allTimeMetrics.totalCommission.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${currentMonthMetrics.totalCommission.toLocaleString()}
            </div>
            <div className="flex items-center text-xs">
              {monthOverMonthGrowth >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={monthOverMonthGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(monthOverMonthGrowth).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesRep.commissionRate}%</div>
            <p className="text-xs text-muted-foreground">On all sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quota Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotaProgress.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {salesRep.targetQuota
                ? `$${salesRep.targetQuota.toLocaleString()} target`
                : 'No quota set'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Calculation Info */}
      <CommissionExplainer calculationMethod={calculationMethod} />

      {/* Period Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Period Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Last 30 Days</div>
                  <div className="text-sm text-muted-foreground">
                    {last30DaysMetrics.orderCount} orders
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    ${last30DaysMetrics.totalCommission.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${last30DaysMetrics.totalSales.toLocaleString()} sales
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">This Month</div>
                  <div className="text-sm text-muted-foreground">
                    {currentMonthMetrics.orderCount} orders
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    ${currentMonthMetrics.totalCommission.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${currentMonthMetrics.totalSales.toLocaleString()} sales
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Last Month</div>
                  <div className="text-sm text-muted-foreground">
                    {lastMonthMetrics.orderCount} orders
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    ${lastMonthMetrics.totalCommission.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${lastMonthMetrics.totalSales.toLocaleString()} sales
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">This Year</div>
                  <div className="text-sm text-muted-foreground">
                    {currentYearMetrics.orderCount} orders
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    ${currentYearMetrics.totalCommission.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${currentYearMetrics.totalSales.toLocaleString()} sales
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Order Value</span>
                <span className="font-bold">${allTimeMetrics.averageOrderValue.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Orders</span>
                <span className="font-bold">{allTimeMetrics.orderCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Dealers</span>
                <span className="font-bold">
                  {assignedDealers.filter((d: any) => d.verified && d._verified).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Dealers</span>
                <span className="font-bold">{assignedDealers.length}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Commission per Order</span>
                  <span className="font-bold">
                    $
                    {allTimeMetrics.orderCount > 0
                      ? (allTimeMetrics.totalCommission / allTimeMetrics.orderCount).toFixed(2)
                      : '0'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission by Dealer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Commission by Dealer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commissionByDealer.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Commission Data</h3>
              <p className="text-muted-foreground">
                Commission data will appear here once your dealers start placing orders.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {commissionByDealer.map((item, index) => (
                <div
                  key={item.dealer.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{item.dealer.companyName}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.orderCount} orders • ${item.totalSales.toLocaleString()} sales
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${item.commission.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Commission</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/sales-rep/dealers">
                <Users className="h-4 w-4 mr-2" />
                View My Dealers
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sales-rep/dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sales-rep/profile">
                <Target className="h-4 w-4 mr-2" />
                Update Goals
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
