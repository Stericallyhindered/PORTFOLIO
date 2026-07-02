'use client'

import type { Product } from '@/payload-types'
import { AccessorySpecs } from './battery-accessory-swag-specs/accessory-specs'
import { BatterySpecs } from './battery-accessory-swag-specs/battery-specs'
import { SwagSpecs } from './battery-accessory-swag-specs/swag-specs'

interface ProductSpecsProps {
  product: Product
}

// Main ProductSpecs component that handles conditional rendering
export const ProductSpecs: React.FC<ProductSpecsProps> = ({ product }) => {
  if (!product.productType) return null

  switch (product.productType) {
    case 'battery':
      return <BatterySpecs product={product} />
    case 'accessory':
      return <AccessorySpecs product={product} />
    case 'swag':
      return <SwagSpecs product={product} />
    default:
      return null
  }
}
