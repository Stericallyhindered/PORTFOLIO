'use client'

import React from 'react'
import type { Product } from '@/payload-types'

interface ProductSchemaProps {
  product: Product
  baseUrl?: string
}

export function ProductSchema({
  product,
  baseUrl = 'https://stealthbatteries.com',
}: ProductSchemaProps) {
  // Don't render if essential data is missing
  if (!product.title || !product.slug) {
    return null
  }

  // Get the product image URL
  const getImageUrl = (image: any): string | undefined => {
    if (!image) return undefined
    if (typeof image === 'object' && 'url' in image) {
      return image.url.startsWith('http') ? image.url : `${baseUrl}${image.url}`
    }
    return undefined
  }

  const imageUrl = getImageUrl(product.heroImage)
  const productUrl = `${baseUrl}/products/${product.slug}`

  // Build the product schema
  const productSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description:
      product.description ||
      `${product.title} - High-quality marine battery from Stealth Batteries`,
    url: productUrl,
    ...(imageUrl && { image: imageUrl }),
    ...(product.modelNumber && { model: product.modelNumber }),
    brand: {
      '@type': 'Brand',
      name: 'Stealth Batteries',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Stealth Batteries',
      url: baseUrl,
    },
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'USD',
      availability:
        product.inventory?.quantity && product.inventory.quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: productUrl,
      seller: {
        '@type': 'Organization',
        name: 'Stealth Batteries',
        url: baseUrl,
      },
    },
    category:
      product.productType === 'battery'
        ? 'Marine Batteries'
        : product.productType === 'accessory'
          ? 'Marine Accessories'
          : 'Marine Equipment',
  }

  // Add battery-specific properties
  if (product.productType === 'battery' && product.specifications) {
    const specs = product.specifications
    const additionalProperties: any = {}

    if (specs.ampHours) {
      additionalProperties.ampereHour = `${specs.ampHours} Ah`
    }

    if (specs.voltage?.displayedVoltage) {
      additionalProperties.voltage = `${specs.voltage.displayedVoltage}V`
    }

    if (specs.weight) {
      additionalProperties.weight = {
        '@type': 'QuantitativeValue',
        value: specs.weight,
        unitCode: 'LBR',
      }
    }

    if (specs.dimensions) {
      const { length, width, height } = specs.dimensions
      if (length && width && height) {
        additionalProperties.depth = {
          '@type': 'QuantitativeValue',
          value: length,
          unitCode: 'INH',
        }
        additionalProperties.width = {
          '@type': 'QuantitativeValue',
          value: width,
          unitCode: 'INH',
        }
        additionalProperties.height = {
          '@type': 'QuantitativeValue',
          value: height,
          unitCode: 'INH',
        }
      }
    }

    Object.assign(productSchema, additionalProperties)
  }

  // Add accessory-specific properties
  if (product.productType === 'accessory' && product.accessoryDetails) {
    const accessory = product.accessoryDetails
    if (accessory.compatibility) {
      productSchema.isCompatibleWith = accessory.compatibility
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(productSchema, null, 0),
      }}
    />
  )
}
