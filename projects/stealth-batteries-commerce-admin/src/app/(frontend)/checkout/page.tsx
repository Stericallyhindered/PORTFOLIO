'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { Loader2 } from 'lucide-react'
import { CheckoutForm } from './CheckoutForm'
import { toast } from 'sonner'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function ProcessingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center">
      <div className="bg-card p-8 rounded-lg shadow-lg text-center space-y-4 max-w-md w-full mx-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p className="text-lg font-medium">Processing your payment...</p>
        <p className="text-sm text-muted-foreground">
          Please don&apos;t close this window or refresh the page.
        </p>
      </div>
    </div>
  )
}

function RedirectingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center">
      <div className="bg-card p-8 rounded-lg shadow-lg text-center space-y-4 max-w-md w-full mx-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p className="text-lg font-medium text-green-600">Payment successful!</p>
        <p className="text-sm text-muted-foreground">Redirecting to order confirmation...</p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const { state, cartLoaded } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (cartLoaded && state.items.length === 0 && !isProcessing && !isRedirecting) {
      router.push('/cart')
    }
  }, [cartLoaded, state.items, router, isProcessing, isRedirecting])

  const handlePaymentSuccess = (orderId: string) => {
    setIsRedirecting(true)
    // Small delay to ensure the success message is seen
    setTimeout(() => {
      router.push(`/checkout/success?orderId=${orderId}`)
    }, 1000)
  }

  const handlePaymentError = (error: Error) => {
    setIsProcessing(false)
    console.error('Payment error:', error)
    toast.error('Payment failed', {
      description: error.message,
    })
  }

  if (!cartLoaded) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        <p className="mt-4">Loading checkout...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <Elements stripe={stripePromise}>
        <div className="relative">
          <CheckoutForm
            onSubmitStart={() => setIsProcessing(true)}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
          {isProcessing && <ProcessingOverlay />}
          {isRedirecting && <RedirectingOverlay />}
        </div>
      </Elements>
    </div>
  )
}
