'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'

interface AbandonedCart {
  id: string
  email: string
  items: Array<{
    variantId: string
    quantity: number
    price: number
  }>
  subtotal: number
  emailSent: boolean
  emailSentAt: Date | null
  recovered: boolean
  recoveredAt: Date | null
  createdAt: Date
}

interface AbandonedCartsManagerProps {
  carts: AbandonedCart[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AbandonedCartsManager({ carts, pagination }: AbandonedCartsManagerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (id: string, action: 'mark_sent' | 'mark_recovered') => {
    setLoading(id)
    try {
      const response = await fetch('/api/admin/abandoned-carts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update cart')
      }

      window.location.reload()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Abandoned Carts ({pagination.total})
        </h3>
      </div>

      <div className="space-y-2">
        {carts.map((cart) => (
          <Card key={cart.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{cart.email}</h4>
                  <p className="text-sm text-gray-600">
                    Items: {cart.items.length} | Subtotal: {formatPrice(cart.subtotal)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email Sent: {cart.emailSent ? 'Yes' : 'No'}
                    {cart.emailSentAt && ` (${new Date(cart.emailSentAt).toLocaleString()})`}
                  </p>
                  <p className="text-sm text-gray-600">
                    Recovered: {cart.recovered ? 'Yes' : 'No'}
                    {cart.recoveredAt && ` (${new Date(cart.recoveredAt).toLocaleString()})`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(cart.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!cart.emailSent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(cart.id, 'mark_sent')}
                      disabled={loading === cart.id}
                    >
                      Mark Email Sent
                    </Button>
                  )}
                  {!cart.recovered && (
                    <Button
                      size="sm"
                      onClick={() => handleAction(cart.id, 'mark_recovered')}
                      disabled={loading === cart.id}
                    >
                      Mark Recovered
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => window.location.href = `/admin/abandoned-carts?page=${pagination.page - 1}`}
          >
            Previous
          </Button>
          <span className="flex items-center">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => window.location.href = `/admin/abandoned-carts?page=${pagination.page + 1}`}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}


