'use client'

import React from 'react'

interface BreadcrumbsJsonLdProps {
  productType: 'battery' | 'accessory' | 'swag'
  productTitle: string
  productSlug?: string | null
  baseUrl?: string // allow override for testing, default to production
}

const typeToLabel: Record<string, { label: string; slug: string }> = {
  battery: { label: 'Batteries', slug: 'batteries' },
  accessory: { label: 'Accessories', slug: 'accessories' },
  swag: { label: 'Swag', slug: 'swag' },
}

export function BreadcrumbsJsonLd({
  productType,
  productTitle,
  productSlug,
  baseUrl = 'https://stealthbatteries.com',
}: BreadcrumbsJsonLdProps) {
  // Don't render if essential data is missing
  if (!productTitle || !productSlug) {
    return null
  }

  const type = typeToLabel[productType] || { label: productType, slug: productType }

  // Ensure URLs don't have double slashes and are properly formatted
  const normalizeUrl = (url: string) => {
    return url.replace(/([^:]\/)\/+/g, '$1').replace(/\/$/, '') || url
  }

  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: normalizeUrl(`${baseUrl}/`),
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Products',
      item: normalizeUrl(`${baseUrl}/products`),
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: type.label,
      item: normalizeUrl(`${baseUrl}/products/${type.slug}`),
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: productTitle,
      item: normalizeUrl(`${baseUrl}/products/${type.slug}/${productSlug}`),
    },
  ]

  // Generate clean JSON without extra whitespace
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd, null, 0),
      }}
    />
  )
}
