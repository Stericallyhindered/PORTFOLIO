import React from 'react'

import type { Post, Product } from '@/payload-types'

import { Media } from '@/components/Media'

export const ProductHero: React.FC<{
  product: Product
}> = ({ product }) => {
  const { heroImage } = product

  return (
    <div className="relative flex items-end">
      <div className="min-h-fit select-none">
        {heroImage && typeof heroImage !== 'string' && (
          <Media fill priority imgClassName="z-10 object-contain" resource={heroImage} />
        )}
        <div className="absolute pointer-events-none left-0 bottom-0 w-full h-full bg-transparent" />
      </div>
    </div>
  )
}
