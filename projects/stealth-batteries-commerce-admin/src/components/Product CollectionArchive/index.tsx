import { cn } from '@/utilities/ui'
import React from 'react'

import type { CardProductData } from '@/components/Product Card'
import { ProductCard } from '@/components/Product Card'

export type Props = {
  posts?: any[]
  products?: CardProductData[]
}

export const ProductCollectionArchive: React.FC<Props> = (props) => {
  const { products } = props
  const items = products

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-y-4 gap-x-4 lg:gap-y-8 lg:gap-x-8 xl:gap-x-8">
          {items?.map((result, index) => {
            if (typeof result === 'object' && result !== null) {
              return (
                <div className="col-span-4" key={index}>
                  <ProductCard
                    className="h-full"
                    doc={result}
                    relationTo="products"
                    showCategories={false}
                  />
                </div>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
