'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'

interface GiftCard {
  id: string
  code: string
  initialBalance: number
  balance: number
  expiresAt: Date | null
  active: boolean
  createdAt: Date
  customer: {
    user: {
      name: string | null
      email: string
    }
  } | null
}

interface GiftCardsManagerProps {
  giftCards: GiftCard[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function GiftCardsManager({ giftCards, pagination }: GiftCardsManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    initialBalance: '',
    expiresAt: '',
  })

  const handleGenerateCode = async () => {
    try {
      const response = await fetch('/api/admin/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_code' }),
      })

      if (!response.ok) throw new Error('Failed to generate code')

      const { code } = await response.json()
      setFormData({ ...formData, code })
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/admin/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code || undefined,
          initialBalance: parseFloat(formData.initialBalance),
          expiresAt: formData.expiresAt || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create gift card')
      }

      window.location.reload()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gift Cards ({pagination.total})</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Gift Card'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Auto-generate if empty"
                    />
                    <Button type="button" variant="outline" onClick={handleGenerateCode}>
                      Generate
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="initialBalance">Initial Balance ($) *</Label>
                  <Input
                    id="initialBalance"
                    type="number"
                    step="0.01"
                    value={formData.initialBalance}
                    onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expiresAt">Expires At</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Gift Card'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {giftCards.map((card) => (
          <Card key={card.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">Code: {card.code}</h4>
                  <p className="text-sm text-gray-600">
                    Balance: {formatPrice(card.balance)} / {formatPrice(card.initialBalance)}
                  </p>
                  {card.customer && (
                    <p className="text-sm text-gray-600">
                      Customer: {card.customer.user.name || card.customer.user.email}
                    </p>
                  )}
                  {card.expiresAt && (
                    <p className="text-sm text-gray-600">
                      Expires: {new Date(card.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    Status: <span className={card.active ? 'text-green-600' : 'text-red-600'}>
                      {card.active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(card.createdAt).toLocaleString()}
                  </p>
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
            onClick={() => window.location.href = `/admin/gift-cards?page=${pagination.page - 1}`}
          >
            Previous
          </Button>
          <span className="flex items-center">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => window.location.href = `/admin/gift-cards?page=${pagination.page + 1}`}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}


