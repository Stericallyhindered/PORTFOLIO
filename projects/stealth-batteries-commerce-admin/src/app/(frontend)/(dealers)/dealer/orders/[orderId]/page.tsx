import { cookies } from 'next/headers'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Package, Truck, DollarSign, ExternalLink } from 'lucide-react'
import ReorderButton from './ReorderButton'
import { Metadata } from 'next'

export const generateMetadata = async ({ params }: { params: Promise<{ orderId: string }> }) => {
  const { orderId } = await params
  return {
    title: `Order ${orderId}`,
    description: `View the details of order ${orderId}.`,
  }
}

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

async function getOrder(orderId: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  // First verify the dealer
  const dealer = await getDealerData()

  // Validate orderId to prevent bad requests
  if (!orderId || orderId === 'undefined' || orderId === 'null') {
    console.error('Invalid order ID:', orderId)
    throw new Error('Invalid order ID')
  }

  // Clean the orderId to ensure it doesn't have problematic characters
  const cleanOrderId = encodeURIComponent(orderId.trim())

  // Instead of fetching the order first and then checking dealer ID,
  // we'll rely on the API's access control
  try {
    // Try with UUID lookup first
    let orderResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders/${cleanOrderId}?uuidLookup=true&depth=2`,
      {
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      },
    )

    // If UUID lookup fails, try regular ID lookup
    if (!orderResponse.ok) {
      // Check if order ID is a valid number for numeric lookup
      const isNumeric = /^\d+$/.test(orderId)

      if (!isNumeric) {
        console.error('Order ID is not a valid UUID or numeric ID:', orderId)
        throw new Error('Invalid order ID format')
      }

      orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders/${cleanOrderId}?depth=2`,
        {
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store',
        },
      )
    }

    if (!orderResponse.ok) {
      if (orderResponse.status === 404) {
        throw new Error('Order not found')
      } else if (orderResponse.status === 403) {
        throw new Error('Order does not belong to dealer')
      } else if (orderResponse.status === 400) {
        throw new Error('Invalid order ID format')
      } else {
        throw new Error(`Failed to fetch order: ${orderResponse.statusText}`)
      }
    }

    const order = await orderResponse.json()
    // Since we got this far, the API allowed access to this order
    // Let's still check if the order data is incomplete
    if (!order.items || !order.total) {
      // We need to fetch more complete order data

      // Try calling the dealer orders API to get all orders, then filter
      const dealerOrdersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders?dealerId=${dealer.id}&depth=2`,
        {
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store',
        },
      )

      if (dealerOrdersResponse.ok) {
        const allOrders = await dealerOrdersResponse.json()
        const fullOrder = allOrders.docs.find((o) => o.id.toString() === orderId.toString())

        if (fullOrder) {
          return fullOrder
        }
      }
    }

    return order
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

function getStatusBadgeColor(status: string) {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'bg-green-500'
    case 'shipped':
      return 'bg-blue-500'
    case 'processing':
      return 'bg-yellow-500'
    case 'cancelled':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

function formatPhoneNumber(phoneNumber: string | undefined | null): string {
  if (!phoneNumber) return ''

  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '')

  // Check if we have the correct number of digits
  if (cleaned.length !== 10) return phoneNumber

  // Format as (XXX) XXX-XXXX
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
}

interface PageProps {
  params: Promise<{ orderId: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  try {
    const { orderId } = await params
    const order = await getOrder(orderId)
    // Check if we have the necessary data to display the order
    if (!order.items || !Array.isArray(order.items)) {
      throw new Error('Incomplete order data: missing items')
    }

    // Calculate order summary
    const totalItems = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    const subtotal = order.subtotal
    const dealerDiscount = order.discounts?.dealer?.amount || 0
    const volumeDiscount = order.discounts?.dealer?.volumeDiscountAmount || 0
    const totalDealerDiscount = dealerDiscount + volumeDiscount

    // Calculate potential revenue, dealer cost, and profit for this order
    const potentialRevenue = order.items.reduce((sum: number, item: any) => {
      if (
        typeof item.product === 'object' &&
        'price' in item.product &&
        typeof item.product.price === 'number'
      )
        return sum + item.quantity * item.product.price
      return sum
    }, 0)
    const dealerCost = order.items.reduce((sum: number, item: any) => {
      if (typeof item.price === 'number') return sum + item.quantity * item.price
      return sum
    }, 0)
    const potentialProfit = potentialRevenue - dealerCost

    return (
      <div className="md:container mx-auto flex-col md:flex">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex gap-4 flex-col md:flex-row items-center justify-between">
            <div className="space-y-1 w-full text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
              <p className="text-muted-foreground">
                Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center">
              <ReorderButton items={order.items} />
            </div>
          </div>

          {/* Order Status Cards */}
          <div>
            <h2 className="text-lg font-medium">Quick Order Details</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalItems}</div>
                </CardContent>
              </Card>

              <Card className="col-span-2 md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Shipping</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${order.shipping?.toFixed(2) || '0.00'}</div>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dealer Discount</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${dealerDiscount.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dealer Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${order.dealerTotal?.toFixed(2) || '0.00'}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Billing Information */}
            {order.billingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Billing Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {order.billingAddress.firstName} {order.billingAddress.lastName}
                    </p>
                    {order.billingAddress.phone && (
                      <p className="text-sm text-muted-foreground">
                        Phone: {formatPhoneNumber(order.billingAddress.phone)}
                      </p>
                    )}
                    <p className="text-sm">
                      {order.billingAddress.line1}
                      {order.billingAddress.line2 && (
                        <>
                          <br />
                          {order.billingAddress.line2}
                        </>
                      )}
                    </p>
                    <p className="text-sm">
                      {order.billingAddress.city}, {order.billingAddress.state}{' '}
                      {order.billingAddress.postalCode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Information */}
            {order.shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Shipping Information
                      </div>
                      {order.isDropship && (
                        <Badge variant="secondary" className="ml-2">
                          Dropship
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                    {order.shippingAddress.phone && (
                      <p className="text-sm text-muted-foreground">
                        Phone: {formatPhoneNumber(order.shippingAddress.phone)}
                      </p>
                    )}
                    <p className="text-sm">
                      {order.shippingAddress.line1}
                      {order.shippingAddress.line2 && (
                        <>
                          <br />
                          {order.shippingAddress.line2}
                        </>
                      )}
                    </p>
                    <p className="text-sm">
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.postalCode}
                    </p>
                    {order.trackingNumber && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">Tracking Number</p>
                        <a
                          href={`https://www.ups.com/track?tracknum=${order.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {order.trackingNumber}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Items */}
          <Card className="mt-6 pb-2">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {typeof item.product === 'object' ? (
                            <>
                              {item.product.slug ? (
                                <Link
                                  href={`/products/${item.product.slug}`}
                                  className="flex items-center hover:text-blue-600 transition-colors"
                                >
                                  {item.product.title}
                                  <ExternalLink className="ml-2 h-4 w-4" />
                                </Link>
                              ) : (
                                <span>{item.product.title}</span>
                              )}
                              <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                            </>
                          ) : (
                            <>
                              {item.title}
                              {item.variant && (
                                <p className="text-sm text-muted-foreground">
                                  {item.variant.name}: {item.variant.value}
                                </p>
                              )}
                            </>
                          )}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>${(item.quantity * item.price).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Subtotal
                      </TableCell>
                      <TableCell className="font-medium">${subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Dealer Discount
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        -${dealerDiscount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    {volumeDiscount > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Volume Discount
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          -${volumeDiscount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Tax
                      </TableCell>
                      <TableCell className="font-medium">
                        ${order.tax?.toFixed(2) || '0.00'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Shipping
                      </TableCell>
                      <TableCell className="font-medium">
                        ${order.shipping?.toFixed(2) || '0.00'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-bold">
                        Total
                      </TableCell>
                      <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 px-2">
                {order.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 overflow-x-auto min-w-[300px]"
                  >
                    <div className="flex flex-col space-y-3">
                      {/* Product Title and SKU */}
                      <div className="min-w-0">
                        {typeof item.product === 'object' ? (
                          <>
                            {item.product.slug ? (
                              <Link
                                href={`/products/${item.product.slug}`}
                                className="flex items-center hover:text-blue-600 transition-colors font-medium text-base"
                              >
                                <span className="truncate">{item.product.title}</span>
                                <ExternalLink className="ml-2 h-4 w-4 flex-shrink-0" />
                              </Link>
                            ) : (
                              <span className="font-medium text-base truncate">
                                {item.product.title}
                              </span>
                            )}
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                              {item.product.sku}
                            </p>
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-base truncate">{item.title}</span>
                            {item.variant && (
                              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                {item.variant.name}: {item.variant.value}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Price Information */}
                      <div className="flex items-center justify-between border-t pt-3 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="min-w-[80px]">
                            <p className="text-sm text-muted-foreground">Unit Price</p>
                            <p className="font-medium">${item.price.toFixed(2)}</p>
                          </div>
                          <div className="text-muted-foreground">×</div>
                          <div className="min-w-[70px]">
                            <p className="text-sm text-muted-foreground">Quantity</p>
                            <p className="font-medium">{item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="font-medium">${(item.quantity * item.price).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mobile Order Summary */}
                <div className="border rounded-lg p-4 space-y-3 mt-6">
                  <h3 className="font-semibold text-lg">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground min-w-[100px]">Subtotal</span>
                      <span className="font-medium text-right">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground min-w-[100px]">Dealer Discount</span>
                      <span className="font-medium text-green-600 text-right">
                        -${dealerDiscount.toFixed(2)}
                      </span>
                    </div>
                    {volumeDiscount > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground min-w-[100px]">Volume Discount</span>
                        <span className="font-medium text-green-600 text-right">
                          -${volumeDiscount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground min-w-[100px]">Tax</span>
                      <span className="font-medium text-right">
                        ${order.tax?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground min-w-[100px]">Shipping</span>
                      <span className="font-medium text-right">
                        ${order.shipping?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t gap-4">
                      <span className="font-semibold min-w-[100px]">Total</span>
                      <span className="font-bold text-right">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue/Profit Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-xs text-zinc-400 mb-1">Potential Revenue (regular price)</div>
            <div className="text-lg font-bold">${potentialRevenue.toFixed(2)}</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-xs text-zinc-400 mb-1">Dealer Cost (what you paid)</div>
            <div className="text-lg font-bold">${dealerCost.toFixed(2)}</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-xs text-zinc-400 mb-1">Potential Profit</div>
            <div className="text-lg font-bold">${potentialProfit.toFixed(2)}</div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in OrderDetailPage:', error)
    return (
      <div className="container mx-auto flex-col md:flex p-8">
        <div className="flex-1 space-y-4">
          <Card className="bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Error Loading Order</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
              <p className="mt-4">
                This may happen if the order does not exist or you don&apos;t have permission to
                view it.
              </p>
              <div className="mt-6">
                <Link href="/dealer/orders">
                  <Button variant="outline" className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}
