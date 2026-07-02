interface CartItem {
  product: {
    shippingDetails: {
      weight: number
      length: number
      width: number
      height: number
      stackable?: boolean
      freightClass?: string
    }
  }
  quantity: number
}

interface PackageDetails {
  dimensions: {
    length: number
    width: number
    height: number
  }
  weight: number
  requiresLTL: boolean
  freightClass?: string
}

export function calculatePackageDimensions(items: CartItem[]): PackageDetails {
  let totalWeight = 0
  let totalVolume = 0
  let maxLength = 0
  let maxWidth = 0
  let maxHeight = 0
  let requiresLTL = false
  let freightClass: string | undefined

  // Calculate total weight and identify if LTL is needed
  for (const item of items) {
    const { shippingDetails } = item.product
    const itemWeight = shippingDetails.weight * item.quantity

    totalWeight += itemWeight

    // Check if any single item requires LTL based on weight or dimensions
    if (
      itemWeight >= 150 || // Heavy item
      shippingDetails.length > 108 || // Long item (9 feet)
      shippingDetails.width * shippingDetails.height * shippingDetails.length > 5184 // Large volume (3x3x4 feet)
    ) {
      requiresLTL = true
      freightClass = shippingDetails.freightClass
    }

    // For stackable items, we add to total volume
    if (shippingDetails.stackable !== false) {
      totalVolume +=
        shippingDetails.length *
        shippingDetails.width *
        shippingDetails.height *
        item.quantity
    } else {
      // For non-stackable items, we need to account for individual dimensions
      maxLength = Math.max(maxLength, shippingDetails.length)
      maxWidth = Math.max(maxWidth, shippingDetails.width)
      maxHeight = Math.max(maxHeight, shippingDetails.height * item.quantity)
    }
  }

  // If we have stackable items, calculate their dimensions based on total volume
  if (totalVolume > 0) {
    // Aim for a roughly cubic shape for stackable items
    const dimension = Math.cbrt(totalVolume)
    maxLength = Math.max(maxLength, Math.ceil(dimension))
    maxWidth = Math.max(maxWidth, Math.ceil(dimension))
    maxHeight = Math.max(maxHeight, Math.ceil(dimension))
  }

  // Check if total package requires LTL
  if (
    totalWeight >= 150 || // Total weight threshold
    maxLength > 108 || // Length threshold
    maxWidth * maxHeight * maxLength > 5184 // Volume threshold
  ) {
    requiresLTL = true
  }

  return {
    dimensions: {
      length: maxLength,
      width: maxWidth,
      height: maxHeight,
    },
    weight: totalWeight,
    requiresLTL,
    freightClass,
  }
} 