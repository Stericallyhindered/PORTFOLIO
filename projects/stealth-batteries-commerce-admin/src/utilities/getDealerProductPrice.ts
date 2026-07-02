export function getDealerProductPrice({
  product,
  dealer,
}: {
  product: { id: string; price: number; dealerPrice?: number }
  dealer?: { customPrices?: any[] }
}): number {
  if (!dealer) {
    return product.price
  }
  const custom = dealer.customPrices?.find(
    (entry: any) =>
      String(entry.product) === String(product.id) ||
      (typeof entry.product === 'object' && String(entry.product.id) === String(product.id)),
  )
  if (custom) {
    if (typeof custom.fixedPrice === 'number') return custom.fixedPrice
    if (typeof custom.discountPercent === 'number') {
      // Apply discount percentage to dealer price if it exists, otherwise to regular price
      const basePrice =
        typeof product.dealerPrice === 'number' ? product.dealerPrice : product.price
      return basePrice * (1 - custom.discountPercent / 100)
    }
  } else {
  }

  if (typeof product.dealerPrice === 'number') {
    return product.dealerPrice
  }
  return product.price
}
