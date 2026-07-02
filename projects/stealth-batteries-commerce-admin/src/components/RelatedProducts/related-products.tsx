'use client'
import Image from 'next/image'
import type { Product as PayloadProduct } from '@/payload-types'

export default function RelatedProducts({ product }: { product: PayloadProduct }) {
  return (
    <div className="container px-4 flex flex-col gap-4">
      <hr className="border-t border-primary/80" />
      <div className="flex flex-col gap-4 w-full">
        <h2 className="text-2xl font-bold">Related Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4  relative">
          {product.relatedProducts
            ?.filter(
              (relatedProduct): relatedProduct is PayloadProduct =>
                relatedProduct !== null &&
                typeof relatedProduct === 'object' &&
                'id' in relatedProduct &&
                typeof relatedProduct.id === 'number' &&
                'title' in relatedProduct &&
                typeof relatedProduct.title === 'string' &&
                'slug' in relatedProduct &&
                typeof relatedProduct.slug === 'string',
            )
            ?.slice(0, 8)
            ?.map((relatedProduct) => {
              const heroImageUrl =
                typeof relatedProduct.heroImage === 'object' &&
                relatedProduct.heroImage !== null &&
                'url' in relatedProduct.heroImage
                  ? relatedProduct.heroImage.url
                  : ''
              return (
                <a
                  href={`/products/${relatedProduct.slug}`}
                  key={relatedProduct.id}
                  className="group hover:opacity-80 transition-opacity"
                >
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2 flex flex-col gap-2">
                    <div className="relative aspect-square w-full overflow-hidden rounded-md">
                      <Image
                        src={heroImageUrl || '/assets/PNG/product-placeholder.png'}
                        alt={relatedProduct.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="text-sm font-medium group-hover:underline text-center">
                      {relatedProduct.title}
                    </div>
                  </div>
                </a>
              )
            })}
        </div>
      </div>
    </div>
  )
}
