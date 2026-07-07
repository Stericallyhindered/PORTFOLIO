'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'

interface Return {
  id: string
  returnNumber: string
  status: string
  reason: string | null
  items: Array<{
    orderItemId: string
    variantId: string
    quantity: number
    price: number
  }>
  refundAmount: number
  refundMethod: string | null
  refunded: boolean
  refundedAt: Date | null
  createdAt: Date
  order: {
    orderNumber: string
    customer: {
      user: {
        name: string | null
        email: string
      }
    } | null
  }
}

interface ReturnsManagerProps {
  returns: Return[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function ReturnsManager({ returns, pagination }: ReturnsManagerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'complete', reason?: string) => {
    setLoading(id)
    try {
      const response = await fetch('/api/admin/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id, reason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process return')
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
        <h3 className="text-lg font-semibold">Returns ({pagination.total})</h3>
      </div>

      <div className="space-y-2">
        {returns.map((returnRecord) => (
          <Card key={returnRecord.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">Return #{returnRecord.returnNumber}</h4>
                  <p className="text-sm text-gray-600">
                    Order: {returnRecord.order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    Customer: {returnRecord.order.customer?.user.name || returnRecord.order.customer?.user.email || 'Guest'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Items: {returnRecord.items.length} | Refund: {formatPrice(returnRecord.refundAmount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-semibold">{returnRecord.status}</span>
                  </p>
                  {returnRecord.reason && (
                    <p className="text-sm text-gray-600">Reason: {returnRecord.reason}</p>
                  )}
                  {returnRecord.refundMethod && (
                    <p className="text-sm text-gray-600">Refund Method: {returnRecord.refundMethod}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Refunded: {returnRecord.refunded ? 'Yes' : 'No'}
                    {returnRecord.refundedAt && ` (${new Date(returnRecord.refundedAt).toLocaleString()})`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(returnRecord.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {returnRecord.status === 'PENDING' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(returnRecord.id, 'approve')}
                        disabled={loading === returnRecord.id}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const reason = prompt('Rejection reason:')
                          if (reason) handleAction(returnRecord.id, 'reject', reason)
                        }}
                        disabled={loading === returnRecord.id}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {returnRecord.status === 'APPROVED' && !returnRecord.refunded && (
                    <Button
                      size="sm"
                      onClick={() => handleAction(returnRecord.id, 'complete')}
                      disabled={loading === returnRecord.id}
                    >
                      Complete & Refund
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
            onClick={() => window.location.href = `/admin/returns?page=${pagination.page - 1}`}
          >
            Previous
          </Button>
          <span className="flex items-center">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => window.location.href = `/admin/returns?page=${pagination.page + 1}`}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}


