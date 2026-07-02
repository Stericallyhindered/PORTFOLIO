'use client'

import { useDealer } from '@/hooks/useDealer'
import { cn } from '@/lib/utils'
import { getDealerProductPrice } from '@/utilities/getDealerProductPrice'

interface DealerPriceProps {
  price: number
  dealerPrice?: number
  className?: string
  showRegularPrice?: boolean
  productId?: string | number // Optional, for custom price lookup
}

export function DealerPrice({
  price,
  dealerPrice,
  className,
  showRegularPrice = true,
  productId,
}: DealerPriceProps) {
  const { dealer, isLoading } = useDealer()

  if (isLoading) {
    return <span className={className}>${price.toFixed(2)}</span>
  }

  const isDealer = dealer && dealer.verified
  // Use getDealerProductPrice if productId is provided (for custom pricing)
  let priceToShow = price
  if (productId !== undefined) {
    priceToShow = getDealerProductPrice({
      product: { id: String(productId), price, dealerPrice },
      dealer: isDealer ? (dealer as any) : undefined,
    })
  } else if (isDealer && typeof dealerPrice === 'number') {
    priceToShow = dealerPrice
  }

  // Show regular price for non-dealers
  if (!isDealer) {
    return <span className={className}>${price.toFixed(2)}</span>
  }

  // Show only the dealer price if no regular price is requested
  if (!showRegularPrice) {
    return <span className={className}>${priceToShow.toFixed(2)}</span>
  }

  // Show both regular and dealer/custom price for dealers
  return (
    <div className={cn('flex flex-col lg:flex-row items-center gap-2', className)}>
      <span className="text-muted-foreground line-through font-noto">${price.toFixed(2)}</span>
      <span className="font-semibold font-noto">${priceToShow.toFixed(2)}</span>
    </div>
  )
}
