import { cookies } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'
import OrdersTable from './OrdersTable'
import { redirect } from 'next/navigation'
import { DateRangeSelector } from '@/components/DateRangeSelector'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Orders',
  description: 'View your dealer orders and manage your inventory.',
}

export const dynamic = 'force-dynamic'

// Reuse the getDealerData and getDealerOrders functions
async function getDealerData() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  const dealerResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/me`, {
    headers: {
      Authorization: `JWT ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
  })

  if (!dealerResponse.ok) {
    throw new Error('Failed to fetch dealer data')
  }

  const data = await dealerResponse.json()
  return data.user
}

async function getDealerOrders(
  dealerId: string | number,
  page?: number,
  limit?: number,
  dateRange?: string,
) {
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

  // Start building the query parameters
  const params = new URLSearchParams()
  params.append('depth', '2')
  if (page) params.append('page', page.toString())
  if (limit) params.append('limit', limit.toString())
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
    if (ordersResponse.status === 401 || ordersResponse.status === 403) {
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

export default async function OrdersPage({ searchParams }: PageProps) {
  try {
    // Get dealer data and search params concurrently
    const [dealer, params] = await Promise.all([getDealerData(), searchParams])

    if (!dealer?.id) {
      redirect('/dealer-login')
    }

    // Get pagination and date range parameters from URL
    const pageParam = params?.page
    const limitParam = params?.limit
    const dateRange = typeof params?.range === 'string' ? params.range : '30'
    const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : 1
    const limit = typeof limitParam === 'string' ? parseInt(limitParam, 10) : 10

    // Fetch both paginated data for the table and all data for summary
    const [paginatedOrders, allOrders] = await Promise.all([
      getDealerOrders(dealer.id, page, limit, dateRange),
      getDealerOrders(dealer.id, undefined, undefined, dateRange),
    ])

    // Use filtered orders from getDealerOrders
    const orders = allOrders.docs || []

    // Calculate summary statistics from filtered orders
    const totalOrders = orders.length
    const processingOrders = orders.filter(
      (order: any) => order.status.toLowerCase() === 'processing',
    ).length
    const completedOrders = orders.filter(
      (order: any) => order.status.toLowerCase() === 'completed',
    ).length
    const backOrders = orders.filter(
      (order: any) => order.status.toLowerCase() === 'back-order',
    ).length

    // Update pagination data to reflect filtered orders
    const paginatedOrdersWithCorrectTotal = {
      ...paginatedOrders,
      totalDocs: totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
    }

    return (
      <div className="container mx-auto flex-col md:flex">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <DateRangeSelector />
          </div>

          {/* Order Status Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <Package className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{processingOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Package className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Back-Orders</CardTitle>
                <Package className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders {dateRange === 'all' ? '(All Time)' : `(Last ${dateRange} Days)`}
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <OrdersTable orders={paginatedOrdersWithCorrectTotal} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in OrdersPage:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    return (
      <div className="container mx-auto flex-col md:flex">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Error Loading Orders</h2>
            <Link href="/dealer/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
}
