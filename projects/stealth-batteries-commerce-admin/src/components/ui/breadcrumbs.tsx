'use client'

import Link from 'next/link'
import type { FC } from 'react'

interface BreadcrumbsProps {
  productType: 'battery' | 'accessory' | 'swag'
  productTitle: string
  productSlug?: string | null
}

const typeToLabel: Record<string, { label: string; slug: string }> = {
  battery: { label: 'Batteries', slug: 'batteries' },
  accessory: { label: 'Accessories', slug: 'accessories' },
  swag: { label: 'Swag', slug: 'swag' },
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ productType, productTitle, productSlug }) => {
  const type = typeToLabel[productType] || { label: productType, slug: productType }
  return (
    <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link href="/" className="hover:underline hover:text-primary">
            Home
          </Link>
        </li>
        <li className="mx-1">/</li>
        <li>
          <Link href="/products" className="hover:underline hover:text-primary">
            Products
          </Link>
        </li>
        <li className="mx-1">/</li>
        <li>
          <Link href={`/products/${type.slug}`} className="hover:underline hover:text-primary">
            {type.label}
          </Link>
        </li>
        <li className="mx-1">/</li>
        <li className="text-primary font-medium" aria-current="page">
          {productTitle}
        </li>
      </ol>
    </nav>
  )
}
