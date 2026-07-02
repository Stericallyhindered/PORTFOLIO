import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Media, Product } from '@/payload-types'
import { formatPrice } from '@/utilities/formatPrice'
import { DealerPrice } from '@/components/DealerPrice'

interface ProductGridProps {
  products: Product[]
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product) => (
        <div key={product.id} className="h-full">
          <Link href={`/products/${product.slug}`} className="group h-full block">
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:scale-105 h-full flex flex-col">
              {product.heroImage &&
                typeof product.heroImage === 'object' &&
                'url' in product.heroImage && (
                  <div className="relative aspect-square w-full flex-shrink-0">
                    <Image
                      src={product.heroImage.url as string}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              <div className="p-4 flex-grow flex flex-col justify-between">
                <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
                <div className="flex flex-col gap-1">
                  <DealerPrice price={product.price} />
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
