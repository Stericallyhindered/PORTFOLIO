'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/CartContext'
import { DiscountCodeInput } from '@/components/DiscountCodeInput'
import { Product } from '@/payload-types'
import { DiscountProgress } from './VolumeDiscountProgress'
import { useDealer } from '@/hooks/useDealer'

export default function Cart() {
  const {
    state,
    removeItem,
    updateQuantity,
    currentBulkDiscount,
    nextBulkDiscount,
    bulkDiscountProgress,
  } = useCart()
  const { dealer } = useDealer()
  const isDealer = dealer && dealer.verified
  const discountCode = state.discounts.discountCode

  const handleRemoveItem = (id: string | number) => {
    removeItem(id)
  }

  const handleUpdateQuantity = (id: string | number, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(id)
      return
    }
    updateQuantity(id, quantity)
  }

  // Check if the product or selected variant is out of stock
  const isOutOfStock = (product: Product, selectedVariants: any) => {
    if (product.variants && Object.keys(selectedVariants).length > 0) {
      const variant = product.variants.find((v) => v.name === Object.keys(selectedVariants)[0])
      const option = variant?.options?.find((o) => o.value === selectedVariants[variant.name])
      return option?.inventory === 0
    }
    return product.inventory?.trackInventory && product.inventory.quantity === 0
  }

  // Check if the product is a pre-order
  const isPreOrder = (product: Product) => {
    if (!product.releaseDate) return false
    const releaseDate = new Date(product.releaseDate)
    const now = new Date()
    // Set times to midnight for accurate date comparison
    releaseDate.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    return releaseDate > now
  }

  // Calculate subtotal directly from items
  const subtotal = state.items.reduce((total, item) => {
    const lineTotal = Math.floor(item.price * item.quantity * 100) / 100
    return Math.floor((total + lineTotal) * 100) / 100
  }, 0)

  function getDiscountedItemPrice(item: any) {
    if (
      discountCode &&
      discountCode.applicableProducts &&
      discountCode.applicableProducts.length > 0 &&
      (discountCode.applicableProducts.includes(item.id) ||
        discountCode.applicableProducts.includes(String(item.id)))
    ) {
      if (discountCode.type === 'percentage') {
        return Math.floor(item.price * (1 - discountCode.amount / 100) * 100) / 100
      } else {
        return Math.max(0, Math.floor((item.price - discountCode.amount) * 100) / 100)
      }
    }
    return item.price
  }

  // Calculate the discount code amount for the summary
  function getDiscountCodeAmount() {
    const discount = state.discounts.discountCode
    if (!discount) return 0
    if (discount.applicableProducts && discount.applicableProducts.length > 0) {
      // Product-specific discount
      const productIds = discount.applicableProducts.map((p: any) =>
        typeof p === 'object' && (p.id || p.value) ? String(p.id || p.value) : String(p),
      )
      let totalDiscount = 0
      for (const item of state.items) {
        if (productIds.includes(String(item.id))) {
          if (discount.type === 'percentage') {
            totalDiscount +=
              Math.floor(item.price * (discount.amount / 100) * item.quantity * 100) / 100
          } else {
            totalDiscount += Math.floor(discount.amount * item.quantity * 100) / 100
          }
        }
      }
      return totalDiscount
    } else {
      // Subtotal discount
      if (discount.type === 'percentage') {
        return Math.floor(((subtotal * discount.amount) / 100) * 100) / 100
      } else {
        return Math.floor(discount.amount * 100) / 100
      }
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-8 flex items-center justify-center">
          <ShoppingCart className="mr-2" /> Your Cart
        </h1>
        <p className="text-gray-500 mb-8">Your cart is empty</p>
        <Link href="/products" passHref>
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <ShoppingCart className="mr-2" /> Your Cart
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {state.items.map((item) => (
            <div
              key={`${item.id}-${item.variant?.value}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4"
            >
              <div className="flex items-start">
                <Image
                  src={item.image || '/placeholder.svg'}
                  alt={item.title}
                  width={150}
                  height={150}
                  className="rounded-md mr-4 w-20 h-20 sm:w-[75px] sm:h-[75px] object-contain"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-sm sm:text-base break-words">{item.title}</h2>
                  {item.variant && (
                    <p className="text-xs sm:text-sm text-gray-500">
                      {item.variant.name}: {item.variant.value}
                    </p>
                  )}
                  <p className="text-gray-400 text-sm sm:text-base">
                    {isDealer ? (
                      getDiscountedItemPrice(item) !== item.price ? (
                        <>
                          <span className="line-through mr-2">${item.price.toFixed(2)}</span>
                          <span className="font-bold text-primary">
                            ${getDiscountedItemPrice(item).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        `$${item.price.toFixed(2)}`
                      )
                    ) : item.publicPrice !== undefined ? (
                      `$${item.publicPrice.toFixed(2)}`
                    ) : (
                      `$${item.price.toFixed(2)}`
                    )}
                  </p>
                </div>
              </div>
              {isPreOrder(item.product) ? (
                <div className="text-primary">
                  <p className="text-sm text-center">Pre-order</p>
                  <p className="text-xs text-center">
                    Available {new Date(item.product.releaseDate).toLocaleDateString()} - reserved
                    for you!
                  </p>
                </div>
              ) : (
                isOutOfStock(item.product, item.variant) && (
                  <div className="text-primary">
                    <p className="text-sm text-center">Out of Stock</p>
                    <p className="text-xs text-center">
                      Please allow an additional 3 - 4 weeks on average for delivery
                    </p>
                  </div>
                )
              )}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    aria-label={`Decrease quantity of ${item.title}`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (!isNaN(val)) {
                        handleUpdateQuantity(item.id, val)
                      }
                    }}
                    min="1"
                    className="w-12 text-center bg-transparent border-none focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label={`Quantity of ${item.title}`}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    aria-label={`Increase quantity of ${item.title}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => handleRemoveItem(item.id)}
                  aria-label={`Remove ${item.title} from cart`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="mt-6">
            <Link href="/products" passHref>
              <Button variant="outline" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-lg h-fit">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm sm:text-base">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">${subtotal.toFixed(2)}</span>
            </div>

            {/* Bulk Discount UI - Only show for dealers */}
            {isDealer && currentBulkDiscount && (
              <div className="flex justify-between text-green-700">
                <span>Bulk Discount ({currentBulkDiscount.name})</span>
                <span>
                  -$
                  {(
                    Math.floor(subtotal * (currentBulkDiscount.discountPercent / 100) * 100) / 100
                  ).toFixed(2)}
                </span>
              </div>
            )}
            {isDealer && nextBulkDiscount && bulkDiscountProgress !== null && (
              <DiscountProgress
                subtotal={subtotal}
                threshold={nextBulkDiscount.threshold}
                percent={nextBulkDiscount.discountPercent}
                label={nextBulkDiscount.name}
                isCompact
              />
            )}

            {/* Display applied discounts */}
            {state.discounts?.dealer && (
              <>
                <div className="flex justify-between text-green-600">
                  <span className="break-words flex-1 mr-2">
                    Dealer Discount ({state.discounts.dealer.tierName})
                  </span>
                  <span className="shrink-0">
                    -$
                    {(
                      Math.floor(subtotal * (state.discounts.dealer.percentage / 100) * 100) / 100
                    ).toFixed(2)}
                  </span>
                </div>
                {state.discounts.dealer.volumeDiscountApplied && (
                  <div className="flex justify-between text-green-600">
                    <span className="break-words flex-1 mr-2">
                      Volume Discount ({state.discounts.dealer.volumeDiscountPercentage}%)
                    </span>
                    <span className="shrink-0">
                      -$
                      {(
                        Math.floor(
                          subtotal * (state.discounts.dealer.volumeDiscountPercentage / 100) * 100,
                        ) / 100
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                {/* Always show volume discount progress */}
                <DiscountProgress
                  subtotal={subtotal}
                  threshold={state.discounts.dealer.volumeDiscountThreshold}
                  percent={state.discounts.dealer.volumeDiscountPercentage}
                  label={
                    state.discounts.dealer.volumeDiscountApplied
                      ? 'Volume Discount Applied'
                      : `Volume Discount (${state.discounts.dealer.volumeDiscountPercentage}%)`
                  }
                  isCompact
                />
              </>
            )}

            {state.discounts?.affiliate && (
              <div className="flex justify-between text-green-600">
                <span className="break-words flex-1 mr-2">
                  Affiliate Discount ({state.discounts.affiliate.code})
                </span>
                <span className="shrink-0">
                  -$
                  {(subtotal * (state.discounts.affiliate.percentage / 100)).toFixed(2)}
                </span>
              </div>
            )}

            {state.discounts?.discountCode && (
              <div className="flex justify-between text-green-600">
                <span className="break-words flex-1 mr-2">
                  Discount Code ({state.discounts.discountCode.code})
                </span>
                <span className="shrink-0">-${getDiscountCodeAmount().toFixed(2)}</span>
              </div>
            )}

            {/* Tax line item */}
            <div className="flex justify-between">
              <span className="text-muted-foreground break-words flex-1 mr-2">
                Tax {state.discounts?.dealer?.taxExempt ? '(Exempt)' : ''}
              </span>
              <span className="text-foreground shrink-0">
                {state.discounts?.dealer?.taxExempt ? 'Tax Exempt' : 'Calculated at checkout'}
              </span>
            </div>

            <div className="flex justify-between font-semibold text-base sm:text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span>${state.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Add discount code input */}
          <div className="mt-4 mb-4">
            <DiscountCodeInput />
          </div>

          <Link href="/checkout">
            <Button className="w-full mt-4 sm:mt-6 bg-primary hover:bg-primary/90 text-white">
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
