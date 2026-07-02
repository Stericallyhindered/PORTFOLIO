import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ClipboardList,
  CheckCircle,
  DollarSign,
  Percent,
  Building2,
  Phone,
  MapPin,
  Star,
  TrendingUp,
  ArrowUpRight,
  Calculator,
} from 'lucide-react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { formatPhoneNumber } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DateRangeSelector } from '@/components/DateRangeSelector'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dealer Dashboard',
  description: 'View your dealer dashboard and manage your orders.',
}

async function getDealerData() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    redirect('/dealer-login')
  }

  const dealerResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/me`, {
    headers: {
      Authorization: `JWT ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    credentials: 'include',
  })

  if (!dealerResponse.ok) {
    if (
      dealerResponse.status === 401 ||
      dealerResponse.status === 403 ||
      dealerResponse.status === 404
    ) {
      redirect('/dealer-login')
    }
    throw new Error(`Failed to fetch dealer data: ${dealerResponse.status}`)
  }

  const data = await dealerResponse.json()

  if (!data.user) {
    redirect('/dealer-login')
  }

  if (!data.user._verified) {
    redirect('/verify-email')
  }

  if (!data.user.verified) {
    redirect('/dealer-register/success?registered=pending')
  }

  return data.user
}

async function getDealerOrders(dealerId: string | number, dateRange?: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    redirect('/dealer-login')
  }

  // Ensure dealerId is a valid number
  const parsedDealerId = typeof dealerId === 'string' ? parseInt(dealerId, 10) : dealerId
  if (isNaN(parsedDealerId)) {
    throw new Error('Invalid dealer ID')
  }

  // Build query parameters
  const params = new URLSearchParams()
  params.append('depth', '2')
  params.append('dealerId', parsedDealerId.toString())

  // Calculate date range
  let startDate: Date | undefined
  let endDate: Date | undefined

  if (dateRange && dateRange !== 'all') {
    endDate = new Date()
    startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(dateRange))

    // Set time to start of day for start date and end of day for end date
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    // Add date range parameters
    params.append('from', startDate.toISOString())
    params.append('to', endDate.toISOString())
  }

  const ordersResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders?${params.toString()}`,
    {
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      credentials: 'include',
    },
  )

  if (!ordersResponse.ok) {
    if (
      ordersResponse.status === 401 ||
      ordersResponse.status === 403 ||
      ordersResponse.status === 404
    ) {
      redirect('/dealer-login')
    }
    // Log the error response
    const errorText = await ordersResponse.text()
    console.error('Orders API Error:', {
      status: ordersResponse.status,
      statusText: ordersResponse.statusText,
      response: errorText,
    })
    throw new Error(`Failed to fetch orders: ${ordersResponse.status}`)
  }

  const data = await ordersResponse.json()
  let orders = data.docs || []

  // If date range is specified, filter orders client-side as a backup
  if (startDate && endDate) {
    orders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= startDate! && orderDate <= endDate!
    })
  }

  return {
    ...data,
    docs: orders,
  }
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  // Get dealer data and search params concurrently
  const [dealer, params] = await Promise.all([getDealerData(), searchParams])

  if (!dealer?.id) {
    redirect('/dealer-login')
  }

  const dateRange = typeof params?.range === 'string' ? params.range : '30'
  const ordersData = await getDealerOrders(dealer.id, dateRange)

  // Use the filtered orders from getDealerOrders
  const orders = ordersData.docs || []

  // Calculate stats using filtered orders
  const totalOrders = orders.length

  // Calculate Potential Revenue (if dealer sells at regular price)
  const potentialRevenue = orders.reduce((sum: number, order: any) => {
    if (!order.items) return sum
    return (
      sum +
      order.items.reduce((itemSum: number, item: any) => {
        if (typeof item.product === 'object' && typeof item.product.price === 'number')
          return itemSum + item.quantity * item.product.price
        return itemSum
      }, 0)
    )
  }, 0)

  // Calculate Dealer Cost (what dealer paid)
  const dealerCost = orders.reduce((sum: number, order: any) => {
    if (!order.items) return sum
    return (
      sum +
      order.items.reduce((itemSum: number, item: any) => {
        if (typeof item.price === 'number') return itemSum + item.quantity * item.price
        return itemSum
      }, 0)
    )
  }, 0)

  // Calculate potential profit
  const potentialProfit = potentialRevenue - dealerCost

  // Handle zero orders case for averages
  const averagePotentialRevenue = totalOrders > 0 ? potentialRevenue / totalOrders : 0
  const averageDealerCost = totalOrders > 0 ? dealerCost / totalOrders : 0
  const averagePotentialProfit = totalOrders > 0 ? potentialProfit / totalOrders : 0

  const completedOrders = orders.filter(
    (order: any) => order.status === 'delivered' || order.status === 'shipped',
  ).length

  // Calculate additional statistics
  const totalDiscounts = orders.reduce((sum: number, order: any) => {
    const dealerDiscount = Math.floor((order.discounts?.dealer?.amount || 0) * 100) / 100
    const volumeDiscount =
      Math.floor((order.discounts?.dealer?.volumeDiscountAmount || 0) * 100) / 100
    return Math.floor((sum + dealerDiscount + volumeDiscount) * 100) / 100
  }, 0)

  const totalItems = orders.reduce((sum: number, order: any) => {
    return sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0)
  }, 0)

  const averageItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0
  const averageDiscount =
    totalOrders > 0 ? Math.floor((totalDiscounts / totalOrders) * 100) / 100 : 0

  return (
    <div className="container mx-auto flex-col md:flex">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Welcome, {dealer.contactName || dealer.email?.split('@')[0]}
            </h2>
            <p className="text-muted-foreground">{dealer.companyName}</p>
          </div>
          <div>
            {dealer.discountTier && (
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-200">Current Discount Tier:</p>
                <Badge variant="outline" className="text-xs hover:bg-primary/30">
                  <span className="">
                    {dealer.discountTier.name}{' '}
                    <span className="text-green-600">
                      ({dealer.discountTier.discountPercentage}% off)
                    </span>
                  </span>
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <DateRangeSelector />
          </div>
        </div>

        {/* Order Statistics */}
        <h3 className="text-xl font-semibold mt-8 mb-4">
          Order Statistics {dateRange === 'all' ? '(All Time)' : `(Last ${dateRange} Days)`}
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items Purchased</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value Ordered</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${potentialRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Dealer Price Statistics */}
        <h3 className="text-xl font-semibold mt-8 mb-4">Revenue & Profit Estimates</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${potentialRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">If sold at regular price</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dealer Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dealerCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">What you paid (dealer price)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${potentialProfit.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">If sold at regular price</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Potential Profit</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${averagePotentialProfit.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per order</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Order Details */}
        <h3 className="text-xl font-semibold mt-8 mb-4">Additional Details</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${averagePotentialRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalDiscounts.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Items Per Order</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageItemsPerOrder.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Discount</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${averageDiscount.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Dealer Information */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Dealership Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Company Name</h3>
                    <p>{dealer.companyName}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Address</h3>
                    {dealer.address ? (
                      <p>
                        {dealer.address.line1}
                        {dealer.address.line2 && <br />}
                        {dealer.address.line2}
                        <br />
                        {dealer.address.city}, {dealer.address.state} {dealer.address.zip}
                      </p>
                    ) : (
                      <p>No address provided</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-1">Discount Tier</h3>
                    <p className="font-semibold text-lg">
                      {typeof dealer.discountTier === 'object' && dealer.discountTier
                        ? dealer.discountTier.name
                        : 'Standard Tier'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {typeof dealer.discountTier === 'object' && dealer.discountTier
                        ? `${dealer.discountTier.discountPercentage}% discount on all orders`
                        : 'Standard dealer pricing'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Contact Name</h3>
                    <p>{dealer.contactName}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Email</h3>
                    <p>{dealer.email}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Phone</h3>
                    <p>{formatPhoneNumber(dealer.phoneNumber) || 'No phone number provided'}</p>
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
