import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Building2,
  Phone,
  MapPin,
  Mail,
  Calendar,
  TrendingUp,
  ShoppingCart,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  User,
} from 'lucide-react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { filterOrdersByAssignmentDate } from '@/utilities/filterOrdersByAssignmentDate'
import { formatPhoneNumber } from '@/lib/utils'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Dealers',
  description: 'View your assigned dealers and their recent orders.',
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
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders?dealerId=${dealerId}&limit=200`,
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

function getStatusIcon(dealer: any) {
  const isEmailVerified = dealer._verified === true
  const isAdminVerified = dealer.verified === true
  const isFullyVerified = isEmailVerified && isAdminVerified

  if (isFullyVerified) {
    return <CheckCircle className="h-4 w-4 text-green-500" />
  } else if (isEmailVerified && !isAdminVerified) {
    return <Clock className="h-4 w-4 text-yellow-500" />
  } else {
    return <XCircle className="h-4 w-4 text-red-500" />
  }
}

function getStatusText(dealer: any) {
  const isEmailVerified = dealer._verified === true
  const isAdminVerified = dealer.verified === true
  const isFullyVerified = isEmailVerified && isAdminVerified

  if (isFullyVerified) {
    return 'Active'
  } else if (isEmailVerified && !isAdminVerified) {
    return 'Pending Approval'
  } else {
    return 'Email Not Verified'
  }
}

function getStatusVariant(dealer: any): 'default' | 'secondary' | 'destructive' {
  const isEmailVerified = dealer._verified === true
  const isAdminVerified = dealer.verified === true
  const isFullyVerified = isEmailVerified && isAdminVerified

  if (isFullyVerified) {
    return 'default'
  } else if (isEmailVerified && !isAdminVerified) {
    return 'secondary'
  } else {
    return 'destructive'
  }
}

export default async function MyDealersPage() {
  const salesRep = await getSalesRepData()
  const assignedDealers = await getAssignedDealers(salesRep.id)
  const allOrders = await getDealerOrders(salesRep.id, assignedDealers)

  // Filter orders to only include those placed after assignment dates
  const filteredOrders = filterOrdersByAssignmentDate(allOrders, salesRep.id)

  // Calculate dealer metrics
  const dealersWithMetrics = assignedDealers.map((dealer: any) => {
    const dealerOrders = filteredOrders.filter((order: any) => {
      const orderDealerId = typeof order.dealer === 'object' ? order.dealer?.id : order.dealer
      return orderDealerId === dealer.id
    })

    const totalOrders = dealerOrders.length
    const totalSales = dealerOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
    const recentOrders = dealerOrders.slice(0, 3) // Last 3 orders

    return {
      ...dealer,
      metrics: {
        totalOrders,
        totalSales,
        recentOrders,
      },
    }
  })

  // Sort dealers by total sales (descending)
  dealersWithMetrics.sort((a, b) => b.metrics.totalSales - a.metrics.totalSales)

  const activeDealers = dealersWithMetrics.filter(
    (dealer: any) => dealer.verified && dealer._verified,
  ).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My Dealers</h1>
        <p className="text-muted-foreground">
          Manage and track your assigned dealers and their performance.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dealers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedDealers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Dealers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {allOrders
                .reduce((sum: number, order: any) => sum + (order.total || 0), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dealers List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Assigned Dealers</h2>
        {dealersWithMetrics.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Dealers Assigned</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You don&apos;t have any dealers assigned to you yet. Contact your manager for dealer
                assignments.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {dealersWithMetrics.map((dealer: any) => (
              <Card key={dealer.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-xl">{dealer.companyName}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(dealer)}
                          <Badge variant={getStatusVariant(dealer)}>{getStatusText(dealer)}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ${dealer.metrics.totalSales.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Contact Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{dealer.contactName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${dealer.email}`}
                            className="text-primary hover:underline"
                          >
                            {dealer.email}
                          </a>
                        </div>
                        {dealer.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`tel:${dealer.phone}`}
                              className="text-primary hover:underline"
                            >
                              {formatPhoneNumber(dealer.phone)}
                            </a>
                          </div>
                        )}
                        {dealer.address && (
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="text-sm">
                              <div>{dealer.address.line1}</div>
                              {dealer.address.line2 && <div>{dealer.address.line2}</div>}
                              <div>
                                {dealer.address.city}, {dealer.address.state} {dealer.address.zip}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Joined {new Date(dealer.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Performance
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold">{dealer.metrics.totalOrders}</div>
                          <p className="text-sm text-muted-foreground">Total Orders</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            $
                            {(
                              dealer.metrics.totalSales / Math.max(dealer.metrics.totalOrders, 1)
                            ).toFixed(0)}
                          </div>
                          <p className="text-sm text-muted-foreground">Avg Order Value</p>
                        </div>
                      </div>

                      {/* Recent Orders */}
                      {dealer.metrics.recentOrders.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Recent Orders</h5>
                          <div className="space-y-1">
                            {dealer.metrics.recentOrders.map((order: any) => (
                              <div key={order.id} className="flex justify-between text-sm">
                                <span>Order #{order.orderNumber}</span>
                                <span className="font-medium">${order.total.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/dealers/orders?dealer=${dealer.id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View All Orders
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
