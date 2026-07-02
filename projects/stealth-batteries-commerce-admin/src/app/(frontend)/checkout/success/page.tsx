'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { CheckCircle, InfoIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useDealer } from '@/hooks/useDealer'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OrderDetails {
  id: string
  orderNumber?: number
  stripePaymentIntentId?: string
  status: string
}

export default function CheckoutSuccess() {
  const { clearCart } = useCart()
  const { dealer } = useDealer()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderId = searchParams.get('orderId')
        if (!orderId) {
          setError('No order ID found')
          setIsLoading(false)
          return
        }

        // Clear the cart
        clearCart()

        // Try both with and without uuidLookup to handle both numeric and UUID order IDs
        let response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders/${orderId}?uuidLookup=true&depth=3&populate=items.product,items.product.shippingDetails`,
          {
            credentials: 'include',
          },
        )

        if (!response.ok) {
          // If the first attempt fails, try without uuidLookup
          response = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders/${orderId}?depth=3&populate=items.product,items.product.shippingDetails`,
            {
              credentials: 'include',
            },
          )
        }

        if (!response.ok) {
          throw new Error('Failed to fetch order details')
        }

        const data = await response.json()
        setOrderDetails(data)
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Failed to load order details. Please check your order confirmation email.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [searchParams, clearCart])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Processing Order...</h1>
        <p>Please wait while we confirm your order details.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-lg mb-4">Thank you for your purchase.</p>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
        <div className="space-y-4">
          <Link href="/products">
            <Button variant="outline" className="mr-4">
              Continue Shopping
            </Button>
          </Link>
          {dealer && (
            <Link href="/dealer/orders">
              <Button>View Orders</Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  const isPreOrder = orderDetails?.status === 'pre-order'
  const isBackOrder = orderDetails?.status === 'back-order'

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="mb-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-lg mb-2">Thank you for your purchase.</p>
        {orderDetails && (
          <>
            <p className="text-lg mb-2">
              Order Number: {orderDetails.orderNumber || orderDetails.id}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Reference Number: {orderDetails.stripePaymentIntentId}
            </p>
          </>
        )}
      </div>

      {isPreOrder ? (
        <div className="space-y-4 mb-8">
          <Alert className="text-center w-full flex items-center justify-center">
            <InfoIcon className="h-6 w-6" />
            <AlertDescription className="text-primary text-center">
              Your order contains pre-order items that will ship when they are available.
            </AlertDescription>
          </Alert>
          <p>
            We&apos;ll email you an order confirmation shortly. Once your items are ready to ship,
            we&apos;ll send another email with tracking information.
          </p>
        </div>
      ) : isBackOrder ? (
        <div className="space-y-4 mb-8">
          <Alert className="text-center w-full flex items-center justify-center">
            <InfoIcon className="h-6 w-6" />
            <AlertDescription className="text-primary text-center">
              Your order contains back-ordered items that typically ship in 3-4 weeks.
            </AlertDescription>
          </Alert>
          <p>
            We&apos;ll email you an order confirmation shortly. Once your items are back in stock
            and ready to ship, we&apos;ll send another email with tracking information.
          </p>
        </div>
      ) : (
        <p className="mb-8">
          We&apos;ll email you an order confirmation shortly. Once your order ships, you&apos;ll
          receive another email with tracking information.
        </p>
      )}

      <div className="space-y-4">
        <Link href="/products">
          <Button variant="outline" className="mr-4">
            Continue Shopping
          </Button>
        </Link>
        {dealer && (
          <Link href="/dealer/orders">
            <Button>View Orders</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
