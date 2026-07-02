'use client'
import { ProductSpecsProps } from './shared-functions'
import { AccessoryTitleColumn } from './accessory-specs'
import { SwagTitleColumn } from './swag-specs'
import { BatteryTitleColumn } from './battery-specs'

export const ProductTitleColumn = ({ product }: ProductSpecsProps) => {
  // Get the hero image URL safely
  if (!product.productType) return null

  switch (product.productType) {
    case 'battery':
      return <BatteryTitleColumn product={product} />
    case 'accessory':
      return <AccessoryTitleColumn product={product} />
    case 'swag':
      return <SwagTitleColumn product={product} />
    default:
      return null
  }
}
