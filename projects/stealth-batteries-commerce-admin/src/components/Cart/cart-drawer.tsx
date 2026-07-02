'use client'

import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DiscountCodeInput } from '@/components/DiscountCodeInput'
import { Product } from '@/payload-types'
import { DiscountProgress } from './VolumeDiscountProgress'
import { useDealer } from '@/hooks/useDealer'

interface CartDrawerProps {
  'aria-label'?: string
}

export function CartDrawer({ 'aria-label': ariaLabel = 'Shopping cart' }: CartDrawerProps) {
  const {
    state,
    updateQuantity,
    removeItem,
    isDrawerOpen,
    setDrawerOpen,
    currentBulkDiscount,
    nextBulkDiscount,
    bulkDiscountProgress,
  } = useCart()
  const { dealer } = useDealer()
  const isDealer = dealer && dealer.verified
  const discountCode = state.discounts.discountCode
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0)

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

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="relative bg-transparent" aria-label={ariaLabel}>
          <ShoppingCart className="h-6 w-6 text-white" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 min-w-5 w-fit px-0.5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Quick Cart</SheetTitle>
        </SheetHeader>
        <div className="grow overflow-auto py-4">
          {state.items.length === 0 ? (
            <p className="text-center text-gray-500">Your cart is empty</p>
          ) : (
            state.items.map((item) => (
              <div
                key={`${item.id}-${item.variant?.value}`}
                className="flex flex-col gap-2 items-center justify-between border-b py-4"
              >
                <div className="flex items-center justify-between gap-2 py-4">
                  <div className="flex items-center">
                    <Image
                      src={item.image || '/placeholder.svg'}
                      alt={item.title}
                      width={50}
                      height={50}
                      className="rounded-md mr-4"
                    />
                    <div>
                      <h3 className="font-semibold text-clip">{item.title}</h3>
                      {item.variant && (
                        <p className="text-sm text-gray-500">
                          {item.variant.name}: {item.variant.value}
                        </p>
                      )}
                      <p className="text-gray-400">
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
                  <div className="flex items-center gap-2">
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
              </div>
            ))
          )}
        </div>
        {state.items.length > 0 && (
          <div className="border-t pt-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
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
                    <span>Dealer Discount ({state.discounts.dealer.tierName})</span>
                    <span>
                      -$
                      {(
                        Math.floor(subtotal * (state.discounts.dealer.percentage / 100) * 100) / 100
                      ).toFixed(2)}
                    </span>
                  </div>
                  {state.discounts.dealer.volumeDiscountApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Volume Discount ({state.discounts.dealer.volumeDiscountPercentage}%)
                      </span>
                      <span>
                        -$
                        {(
                          Math.floor(
                            subtotal *
                              (state.discounts.dealer.volumeDiscountPercentage / 100) *
                              100,
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
                  <span>Affiliate Discount ({state.discounts.affiliate.code})</span>
                  <span>
                    -$
                    {(subtotal * (state.discounts.affiliate.percentage / 100)).toFixed(2)}
                  </span>
                </div>
              )}

              {state.discounts?.discountCode && (
                <div className="flex justify-between text-green-600">
                  <span>Discount Code ({state.discounts.discountCode.code})</span>
                  <span>-${getDiscountCodeAmount().toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between mt-2 text-card-foreground">
                <span>Tax</span>
                <span>
                  {state.discounts?.dealer?.taxExempt ? 'Tax Exempt' : 'Calculated at checkout'}
                </span>
              </div>
              <div className="flex justify-between mt-2 text-lg font-bold text-card-foreground">
                <span>Total</span>
                <span>${state.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Add discount code input */}
            <div className="mt-4 mb-4">
              <DiscountCodeInput />
            </div>

            <div className="space-y-2">
              <Link href="/cart" className="block" onClick={() => setDrawerOpen(false)}>
                <Button className="w-full" variant="outline">
                  View Cart
                </Button>
              </Link>
              <Link href="/checkout" className="block" onClick={() => setDrawerOpen(false)}>
                <Button className="w-full bg-primary hover:bg-[#E62F00] text-white">
                  Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
