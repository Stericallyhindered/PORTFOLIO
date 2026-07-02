'use client'

import { useEffect } from 'react'
import { useDealer } from '@/hooks/useDealer'
import { useCart } from '@/context/CartContext'

export function DealerDiscountProvider({ children }: { children: React.ReactNode }) {
  const { dealer, isLoading, error } = useDealer()
  const { setDealerDiscount, clearDealerDiscount } = useCart()

  useEffect(() => {
    // Clear dealer discount if there's an error, dealer is null, or dealer is not verified
    if (
      !isLoading &&
      (!dealer || error || !dealer.discountTier || typeof dealer.discountTier !== 'object')
    ) {
      clearDealerDiscount()
      return
    }

    // Set dealer discount only if we have valid dealer data
    if (!isLoading && dealer && dealer.discountTier && typeof dealer.discountTier === 'object') {
      setDealerDiscount({
        percentage: dealer.discountTier.discountPercentage ?? 0,
        tierId: dealer.discountTier.id,
        tierName: dealer.discountTier.name,
        taxExempt: dealer.taxExempt || false,
        volumeDiscountThreshold: dealer.discountTier.volumeDiscountThreshold ?? 0,
        volumeDiscountPercentage: dealer.discountTier.volumeDiscountPercentage ?? 0,
        volumeDiscountApplied: false,
      })
    }
  }, [dealer, isLoading, error, setDealerDiscount, clearDealerDiscount])

  return <>{children}</>
}
