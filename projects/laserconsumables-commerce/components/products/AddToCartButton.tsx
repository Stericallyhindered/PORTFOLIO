'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { InventoryStatus } from '@/lib/services/inventory'

interface AddToCartButtonProps {
  variantId: string
  initialStatus?: InventoryStatus
}

export default function AddToCartButton({
  variantId,
  initialStatus,
}: AddToCartButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<InventoryStatus | null>(initialStatus || null)

  useEffect(() => {
    // Fetch current inventory status
    fetch(`/api/inventory/${variantId}`)
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => {})
  }, [variantId])

  const handleAddToCart = async () => {
    if (!status?.canPurchase) {
      alert(status?.message || 'This item cannot be purchased')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity: 1 }),
      })

      if (response.ok) {
        router.refresh()
        // Could show a toast notification here
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add to cart')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getButtonText = () => {
    if (loading) return 'Adding...'
    if (!status) return 'Add to Cart'
    if (!status.canPurchase) {
      if (status.status === 'out_of_stock') return 'Out of Stock'
      return status.message || 'Unavailable'
    }
    if (status.status === 'backorder') return 'Add to Cart (Backorder)'
    return 'Add to Cart'
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={!status?.canPurchase || loading}
      className="w-full"
      size="lg"
      variant={status?.status === 'backorder' ? 'outline' : 'default'}
    >
      {getButtonText()}
    </Button>
  )
}

