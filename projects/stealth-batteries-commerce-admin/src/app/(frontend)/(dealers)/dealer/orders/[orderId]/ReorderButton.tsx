'use client'

import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCart } from '@/context/CartContext'
import { useState } from 'react'

interface ReorderButtonProps {
  items: Array<{
    product:
      | {
          id: string | number
          title: string
          slug: string
          heroImage?:
            | {
                url?: string
                filename?: string
                mimeType?: string
                filesize?: number
                width?: number
                height?: number
              }
            | string
        }
      | string
    quantity: number
    price: number
    variant?: {
      name: string
      value: string
    }
  }>
}

export default function ReorderButton({ items }: ReorderButtonProps) {
  const router = useRouter()
  const { addItem, setDrawerOpen } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleReorder = () => {
    if (isAdding) return
    setIsAdding(true)

    try {
      // Add items from the order
      items.forEach((item, index) => {
        if (typeof item.product === 'object') {
          // Get the server URL from environment or default to localhost
          const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

          // Construct image URL with fallbacks
          let imageUrl = '/placeholder.svg'
          if (item.product.heroImage) {
            if (typeof item.product.heroImage === 'object') {
              if (item.product.heroImage.url) {
                imageUrl = item.product.heroImage.url.startsWith('http')
                  ? item.product.heroImage.url
                  : `${serverUrl}${item.product.heroImage.url}`
              } else if (item.product.heroImage.filename) {
                imageUrl = `${serverUrl}/media/${item.product.heroImage.filename}`
              }
            } else if (typeof item.product.heroImage === 'string') {
              imageUrl = item.product.heroImage.startsWith('http')
                ? item.product.heroImage
                : `${serverUrl}${item.product.heroImage}`
            }
          }

          const cartItem = {
            id: String(item.product.id),
            title: item.product.title,
            quantity: item.quantity,
            price: item.price,
            ...(item.variant?.name && item.variant?.value
              ? {
                  variant: {
                    name: item.variant.name,
                    value: item.variant.value,
                  },
                }
              : {}),
            image: imageUrl,
            slug: item.product.slug,
            product: item.product,
          }

          addItem(cartItem)
        } else {
          console.warn('Skipping item - product is not an object:', item)
        }
      })

      // Show success message with action but don't open cart drawer
      toast.success('Items added to cart', {
        description: `${items.length} items from your previous order added to cart`,
        action: {
          label: 'View Cart',
          onClick: () => setDrawerOpen(true),
        },
      })
    } catch (error) {
      console.error('Error adding items to cart:', error)
      toast.error('Failed to add items to cart')
    }

    setTimeout(() => {
      setIsAdding(false)
    }, 300)
  }

  return (
    <Button onClick={handleReorder} className="ml-4" disabled={isAdding}>
      <ShoppingCart className="mr-2 h-4 w-4" />
      {isAdding ? 'Adding...' : 'Reorder Items'}
    </Button>
  )
}
