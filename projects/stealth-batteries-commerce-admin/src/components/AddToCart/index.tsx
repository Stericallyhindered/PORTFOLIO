import React, { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { Button, type ButtonProps } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/utilities/ui'
import { Minus, Plus } from 'lucide-react'
import { useDealer } from '@/hooks/useDealer'
import { getDealerProductPrice } from '@/utilities/getDealerProductPrice'

type AddToCartProps = {
  product: {
    id: string | number
    title: string
    price: number
    image?: string
    releaseDate?: string
    variants?: Array<{
      name: string
      options?: Array<{
        value: string
        priceAdjustment?: number | null
        inventory?: number | null
        id?: string | null
      }> | null
    }> | null
    inventory?: {
      trackInventory?: boolean | null
      quantity: number
      lowStockThreshold?: number | null
    }
    shippingDetails?: {
      weight: number
      length: number
      width: number
      height: number
      stackable?: boolean | null
      hazmat?: boolean | null
      freightClass?: string | null
      requiresLiftgate?: boolean | null
      hazmatClass?: string | null
    }
  }
  compact?: boolean
}

export const AddToCart: React.FC<AddToCartProps> = ({ product, compact = false }) => {
  const { addItem, setDrawerOpen } = useCart()
  const { dealer } = useDealer()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [isAdding, setIsAdding] = useState(false)

  const isPreOrder = () => {
    if (!product.releaseDate) return false
    const releaseDate = new Date(product.releaseDate)
    const now = new Date()
    // Set times to midnight for accurate date comparison
    releaseDate.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    return releaseDate > now
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
    }
  }

  const handleVariantChange = (variantName: string, value: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantName]: value,
    }))
  }

  const calculateFinalPrice = () => {
    // Ensure price is exactly 2 decimal places when first received
    let finalPrice = Math.floor(Number(product.price.toFixed(2)) * 100) / 100
    if (product.variants && product.variants.length > 0) {
      Object.entries(selectedVariants).forEach(([variantName, selectedValue]) => {
        const variant = product.variants?.find((v) => v.name === variantName)
        const option = variant?.options?.find((opt) => opt.value === selectedValue)
        if (option?.priceAdjustment) {
          finalPrice = Math.floor((finalPrice + option.priceAdjustment) * 100) / 100
        }
      })
    }
    return finalPrice
  }

  // Calculate the dealer/custom price for this product
  const calculateDealerPrice = () => {
    return getDealerProductPrice({
      product: {
        id: String(product.id),
        price: product.price,
        dealerPrice: (product as any).dealerPrice,
      },
      dealer: dealer && dealer.verified ? (dealer as any) : undefined,
    })
  }

  // Check if the product or selected variant is out of stock
  const isOutOfStock = () => {
    if (product.variants && Object.keys(selectedVariants).length > 0) {
      const variant = product.variants.find((v) => v.name === Object.keys(selectedVariants)[0])
      const option = variant?.options?.find((o) => o.value === selectedVariants[variant.name])
      return option?.inventory === 0
    }
    return product.inventory?.trackInventory && product.inventory.quantity === 0
  }

  // Get available inventory for the current selection
  const getAvailableInventory = () => {
    if (product.variants && Object.keys(selectedVariants).length > 0) {
      const variant = product.variants.find((v) => v.name === Object.keys(selectedVariants)[0])
      const option = variant?.options?.find((o) => o.value === selectedVariants[variant.name])
      return option?.inventory
    }
    return product.inventory?.trackInventory ? product.inventory.quantity : null
  }

  const handleAddToCart = () => {
    if (isAdding) return
    setIsAdding(true)

    const selectedVariantsList = Object.entries(selectedVariants).map(([name, value]) => ({
      name,
      value,
    }))

    addItem({
      id: product.id,
      title: product.title,
      price: calculateDealerPrice(), // Always store the dealer/custom price as the main price
      publicPrice: product.price, // Store the public price for reference
      dealerPrice: (product as any).dealerPrice, // Store the standard dealer price for reference
      quantity,
      image: product.image,
      variant: selectedVariantsList.length > 0 ? selectedVariantsList[0] : undefined,
      shippingDetails: product.shippingDetails,
      product,
    })

    const availableInventory = getAvailableInventory()

    toast.success('Added to cart', {
      description: `${quantity} x ${product.title} ${selectedVariantsList.length > 0 ? `(${selectedVariantsList[0].value})` : ''} added to your cart`,
      action: {
        label: 'View Cart',
        onClick: () => setDrawerOpen(true),
      },
    })

    setTimeout(() => {
      setIsAdding(false)
    }, 300)
  }

  return (
    <div className={cn('space-y-4', compact && 'space-y-2')}>
      {product.variants?.map((variant) => (
        <div key={variant.name} className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">{variant.name}</label>
          <select
            className="border rounded-md py-2 px-3"
            value={selectedVariants[variant.name] || ''}
            onChange={(e) => handleVariantChange(variant.name, e.target.value)}
          >
            <option value="">Select {variant.name}</option>
            {variant.options?.map((option) => {
              const isOptionOutOfStock = option.inventory === 0
              return (
                <option key={option.value} value={option.value} disabled={isOptionOutOfStock}>
                  {option.value}
                  {option.priceAdjustment &&
                    option.priceAdjustment > 0 &&
                    ` (+$${option.priceAdjustment.toFixed(2)})`}
                  {option.priceAdjustment &&
                    option.priceAdjustment < 0 &&
                    ` (-$${Math.abs(option.priceAdjustment).toFixed(2)})`}
                  {isOptionOutOfStock ? ' (Out of Stock)' : ''}
                </option>
              )
            })}
          </select>
        </div>
      ))}

      <div
        className={cn(
          'flex items-center gap-2 min-h-[60px] px-2',
          compact ? 'flex-col' : 'flex-row',
        )}
      >
        <div className="flex gap-2 items-center bg-card border border-input rounded p-1 px-2 w-full">
          <div className="relative flex items-center justify-end w-fit">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn('h-8 w-8', compact ? 'p-1' : 'p-2')}
              onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (!isNaN(val)) {
                  handleQuantityChange(val)
                }
              }}
              min="1"
              className="w-12 text-center bg-transparent border-none focus:outline-hidden text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn('h-8 w-8', compact ? 'p-1' : 'p-2')}
              onClick={() => handleQuantityChange(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1 w-full">
          <Button
            type="button"
            variant="default"
            onClick={handleAddToCart}
            disabled={isAdding}
            className={cn(
              'bg-primary hover:bg-primary/90 text-primary-foreground hover:cursor-pointer',
              compact ? 'w-full' : '',
            )}
          >
            {isAdding ? 'Adding...' : isPreOrder() ? 'Pre-order' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  )
}
