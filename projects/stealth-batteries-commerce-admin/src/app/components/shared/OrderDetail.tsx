'use client'

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
import { ArrowLeft, Package, Truck, DollarSign, User, Store } from 'lucide-react'
import { Order, Customer, Dealer } from '@/payload-types'
import { StatusUpdateDialog } from '@/app/components/shared/StatusUpdateDialog'
import { CreateShippingLabel } from '@/app/(customAdmin)/admin/orders/[orderId]/CreateShippingLabel'
import { UPSServiceNames } from '@/lib/shipping/constants/ups'
import { ShippingLabel } from '@/components/ShippingLabel'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function getStatusBadgeColor(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-500'
    case 'processing':
      return 'bg-yellow-500'
    case 'pending':
      return 'bg-blue-500'
    case 'cancelled':
      return 'bg-red-500'
    case 'refunded':
      return 'bg-purple-500'
    case 'pre-order':
      return 'bg-orange-500'
    case 'back-order':
      return 'bg-amber-500'
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

interface PopulatedOrder extends Omit<Order, 'customer' | 'dealer'> {
  customer: Customer
  dealer?: Dealer
  shippingService?: string | null
}

interface ExtendedOrder extends PopulatedOrder {
  status:
    | 'completed'
    | 'processing'
    | 'pending'
    | 'cancelled'
    | 'refunded'
    | 'pre-order'
    | 'back-order'
  packageTrackingNumbers?: Array<{
    number: string
    label?: string
    packageNumber?: number
    totalPackages?: number
  }> | null
  discounts?: {
    dealer?: {
      percentage?: number | null
      tierId?: number | null
      tierName?: string | null
      amount?: number | null
      volumeDiscountApplied?: boolean | null
      volumeDiscountThreshold?: number | null
      volumeDiscountPercentage?: number | null
      volumeDiscountAmount?: number | null
    }
    affiliate?: {
      code?: string | null
      percentage?: number | null
      amount?: number | null
      commission?: number | null
    }
    discountCode?: {
      code?: string | null
      type?: 'percentage' | 'fixed' | null
      amount?: number | null
    }
  }
}

interface OrderDetailProps {
  order: ExtendedOrder
  showActions?: boolean
  showDealerInfo?: boolean
  showCustomerInfo?: boolean
}

export function OrderDetail({
  order: initialOrder,
  showActions = false,
  showDealerInfo = false,
  showCustomerInfo = true,
}: OrderDetailProps) {
  const router = useRouter()
  const [order, setOrder] = useState<ExtendedOrder>(initialOrder)

  // Add resend tracking email state
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const refreshOrderData = async () => {
    try {
      const response = await fetch(
        `/api/orders/${order.id}?depth=3&populate=items.product,items.product.shippingDetails`,
      )
      if (!response.ok) {
        throw new Error('Failed to refresh order data')
      }
      const refreshedOrder = await response.json()
      setOrder(refreshedOrder)
    } catch (error) {
      console.error('Error refreshing order data:', error)
    }
  }

  // Handler for resending tracking email
  async function handleResendTrackingEmail() {
    setIsResending(true)
    setResendMessage(null)
    try {
      const res = await fetch(`/api/orders/${order.id}/resend-tracking-email`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to resend email')
      setResendMessage('Tracking email resent successfully!')
    } catch (err) {
      setResendMessage('Failed to resend tracking email.')
    } finally {
      setIsResending(false)
    }
  }

  // Calculate order summary
  const totalItems = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)

  return (
    <div className="md:container mx-auto flex-col md:flex">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Order Status and Summary Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dealer Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${order.dealerTotal?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipping</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${order.shipping?.toFixed(2) || '0.00'}</div>
              {order.shippingService && (
                <div className="text-sm text-muted-foreground mt-1">
                  {UPSServiceNames[order.shippingService] || order.shippingService}
                  {order.shipping === 0 && (
                    <span className="ml-2 text-emerald-600">(Free Shipping)</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer and Dealer Information */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {showCustomerInfo && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Information</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {order.customer?.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {order.customer?.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {formatPhoneNumber(order.customer?.phone)}
                  </p>
                  <div className="mt-4">
                    <strong>Shipping Address:</strong>
                    <p>{order.shippingAddress?.line1}</p>
                    {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
                    <p>
                      {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
                      {order.shippingAddress?.postalCode}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {showDealerInfo && order.dealer && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dealer Information</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {order.dealer.companyName}
                  </p>
                  <p>
                    <strong>Contact:</strong> {order.dealer.contactName}
                  </p>
                  <p>
                    <strong>Phone:</strong> {formatPhoneNumber(order.dealer.phoneNumber)}
                  </p>
                  <p>
                    <strong>Dealer ID:</strong> {order.dealer.id}
                  </p>
                  <div className="mt-4">
                    <strong>Business Address:</strong>
                    <p>{order.dealer.address.line1}</p>
                    {order.dealer.address.line2 && <p>{order.dealer.address.line2}</p>}
                    <p>
                      {order.dealer.address.city}, {order.dealer.address.state}{' '}
                      {order.dealer.address.zip}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {typeof item.product === 'object' ? item.product.title : 'Unknown Product'}
                      {item.product?.modelNumber && (
                        <span className="block text-xs text-zinc-400">
                          Model: {item.product.modelNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>${(item.quantity * item.price).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Order Summary */}
            <div className="mt-6 space-y-2 w-full md:w-1/2 ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>

              {/* Dealer Discounts */}
              {order.discounts?.dealer && (
                <>
                  {order.discounts.dealer.amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Dealer Discount{' '}
                        {order.discounts.dealer.tierName && `(${order.discounts.dealer.tierName})`}
                      </span>
                      <span className="text-red-600">
                        -${order.discounts.dealer.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.discounts.dealer.volumeDiscountAmount &&
                    order.discounts.dealer.volumeDiscountApplied && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Volume Discount</span>
                        <span className="text-red-600">
                          -${order.discounts.dealer.volumeDiscountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                </>
              )}

              {/* Affiliate Discounts */}
              {order.discounts?.affiliate?.amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Affiliate Discount{' '}
                    {order.discounts.affiliate.code && `(${order.discounts.affiliate.code})`}
                  </span>
                  <span className="text-red-600">
                    -${order.discounts.affiliate.amount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Discount Code */}
              {order.discounts?.discountCode?.amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Discount Code{' '}
                    {order.discounts.discountCode.code && `(${order.discounts.discountCode.code})`}
                  </span>
                  <span className="text-red-600">
                    -${order.discounts.discountCode.amount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>${order.shipping?.toFixed(2) || '0.00'}</span>
              </div>

              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Actions */}
        {showActions && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <StatusUpdateDialog
                orderId={order.id.toString()}
                orderNumber={order.orderNumber ?? 0}
                currentStatus={order.status}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.trackingNumber ? (
                  <div className="h-full ">
                    <div className="flex flex-col gap-2">
                      <ShippingLabel
                        orderId={order.id}
                        trackingNumber={order.trackingNumber}
                        packageTrackingNumbers={order.packageTrackingNumbers || undefined}
                      />
                      <Button
                        variant="secondary"
                        onClick={handleResendTrackingEmail}
                        disabled={isResending}
                      >
                        {isResending ? 'Resending...' : 'Resend Tracking Email'}
                      </Button>
                      {resendMessage && (
                        <div className="text-sm text-muted-foreground">{resendMessage}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full ">
                    <div className="space-y-4 rounded-lg border p-6 h-full flex flex-col justify-between">
                      <h3 className="text-lg font-semibold">Shipping Information</h3>
                      <p>No tracking information available</p>
                      <p>Please create a shipping label to track the order.</p>
                    </div>
                  </div>
                )}
                <CreateShippingLabel
                  order={order}
                  onLabelCreated={refreshOrderData}
                  onRefreshOrderData={refreshOrderData}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
