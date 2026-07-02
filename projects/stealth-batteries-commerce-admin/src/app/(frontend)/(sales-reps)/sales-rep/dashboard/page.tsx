import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, TrendingUp, Target, Star } from 'lucide-react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { formatPhoneNumber } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { filterOrdersByAssignmentDate } from '@/utilities/filterOrdersByAssignmentDate'
import { CommissionExplainer } from '@/components/CommissionExplainer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sales Rep Dashboard',
  description: 'View your sales and commission data for Stealth Batteries.',
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

  // Ensure salesRepId is a valid number
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

async function getDealerOrders(salesRepId: string | number) {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    redirect('/sales-rep-login')
  }

  // Get all dealers for this sales rep first
  const dealers = await getAssignedDealers(salesRepId)
  const dealerIds = dealers.map((dealer: any) => dealer.id)

  if (dealerIds.length === 0) {
    return []
  }

  // Get orders for each dealer using the custom orders API
  const allOrders: any[] = []

  for (const dealerId of dealerIds) {
    try {
      const ordersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders?dealerId=${dealerId}&limit=100`,
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

export default async function SalesRepDashboard() {
  const salesRep = await getSalesRepData()
  const assignedDealers = await getAssignedDealers(salesRep.id)
  const allOrders = await getDealerOrders(salesRep.id)

  // Filter orders to only include those placed after assignment dates
  const orders = filterOrdersByAssignmentDate(allOrders, salesRep.id)

  // Get the sales rep's commission calculation method (default to completed_orders if not set)
  const calculationMethod = salesRep.commissionCalculationMethod || 'completed_orders'

  // Filter orders based on calculation method
  const ordersForCommission =
    calculationMethod === 'completed_orders'
      ? orders.filter((order: any) => order.status === 'completed')
      : orders

  // Calculate metrics
  const totalSales = ordersForCommission.reduce(
    (sum: number, order: any) => sum + (order.total || 0),
    0,
  )
  const commissionEarned = totalSales * (salesRep.commissionRate / 100)
  const activeDealers = assignedDealers.filter(
    (dealer: any) => dealer.verified && dealer._verified,
  ).length
  const totalOrders = orders.length

  // Recent orders (last 5)
  const recentOrders = orders
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
          <Badge variant={calculationMethod === 'completed_orders' ? 'default' : 'secondary'}>
            {calculationMethod === 'completed_orders'
              ? 'Completed Orders Only'
              : 'All Orders (Legacy)'}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Welcome back, {salesRep.name}! Here&apos;s your sales overview.
        </p>
      </div>

      {/* Sales Rep Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">Sales Representative Profile</CardTitle>
          <Star className="h-5 w-5 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg font-semibold">{salesRep.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <Badge variant="secondary">
                {salesRep.role
                  ? salesRep.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                  : 'Sales Representative'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Commission Rate</p>
              <p className="text-lg font-semibold">{salesRep.commissionRate}%</p>
            </div>
          </div>
          {salesRep.targetQuota && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">Target Quota</p>
              <p className="text-lg font-semibold">${salesRep.targetQuota.toLocaleString()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Dealers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDealers}</div>
            <p className="text-xs text-muted-foreground">
              {assignedDealers.length - activeDealers} pending approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {ordersForCommission.length} of {totalOrders} orders
            </p>
            {calculationMethod === 'completed_orders' &&
              ordersForCommission.length < totalOrders && (
                <p className="text-xs text-amber-400 mt-1">
                  Only completed orders count toward commission
                </p>
              )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${commissionEarned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">At {salesRep.commissionRate}% rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quota Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesRep.targetQuota
                ? `${Math.round((totalSales / salesRep.targetQuota) * 100)}%`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {salesRep.targetQuota ? 'of target quota' : 'No quota set'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Calculation Info */}
      <CommissionExplainer calculationMethod={calculationMethod} />

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.dealer?.companyName || 'Unknown Dealer'} •{' '}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.total?.toLocaleString()}</p>
                    <div className="flex items-center gap-2 justify-end">
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                      {calculationMethod === 'completed_orders' &&
                        order.status !== 'completed' &&
                        order.status !== 'cancelled' &&
                        order.status !== 'refunded' && (
                          <Badge
                            variant="outline"
                            className="text-xs text-amber-400 border-amber-400"
                          >
                            Commission Pending
                          </Badge>
                        )}
                      {calculationMethod === 'completed_orders' &&
                        (order.status === 'cancelled' || order.status === 'refunded') && (
                          <Badge variant="outline" className="text-xs text-red-400 border-red-400">
                            No Commission
                          </Badge>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No orders found from your assigned dealers yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assigned Dealers */}
      <Card>
        <CardHeader>
          <CardTitle>Your Assigned Dealers</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedDealers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignedDealers.map((dealer: any) => (
                <div key={dealer.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{dealer.companyName}</h3>
                      <p className="text-sm text-muted-foreground">{dealer.contactName}</p>
                      {dealer.phoneNumber && (
                        <p className="text-sm text-muted-foreground">
                          {formatPhoneNumber(dealer.phoneNumber)}
                        </p>
                      )}
                      {dealer.address && (
                        <p className="text-sm text-muted-foreground">
                          {dealer.address.city}, {dealer.address.state}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge
                        variant={dealer.verified && dealer._verified ? 'default' : 'secondary'}
                      >
                        {dealer.verified && dealer._verified ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No dealers assigned to you yet. Contact your manager for dealer assignments.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
