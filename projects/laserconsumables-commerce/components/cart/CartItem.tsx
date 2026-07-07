'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CartItem({ item }: { item: any }) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(item.quantity)
  const [loading, setLoading] = useState(false)

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1) return

    setLoading(true)
    try {
      const response = await fetch(`/api/cart/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      })

      if (response.ok) {
        setQuantity(newQuantity)
        router.refresh()
      }
    } catch (error) {
      alert('Failed to update quantity')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/cart/${item.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      alert('Failed to remove item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg">
      {item.variant.product.images[0] && (
        <div className="relative w-20 h-20 bg-gray-100 rounded">
          <Image
            src={item.variant.product.images[0].url}
            alt={item.variant.product.name}
            fill
            className="object-cover rounded"
          />
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-medium">{item.variant.product.name}</h3>
        <p className="text-sm text-gray-500">{item.variant.sku}</p>
        <p className="font-bold">{formatPrice(item.variant.price)}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpdateQuantity(quantity - 1)}
          disabled={loading || quantity <= 1}
        >
          -
        </Button>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          onBlur={() => handleUpdateQuantity(quantity)}
          className="w-16 text-center"
          min={1}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpdateQuantity(quantity + 1)}
          disabled={loading}
        >
          +
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemove}
          disabled={loading}
        >
          Remove
        </Button>
      </div>
    </div>
  )
}





