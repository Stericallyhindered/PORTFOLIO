'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post, Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { AddToCart } from '@/components/AddToCart'

export type CardPostData = Pick<Post, 'slug' | 'categories' | 'meta' | 'title'>
export type CardProductData = Pick<
  Product,
  | 'id'
  | 'slug'
  | 'productCategories'
  | 'meta'
  | 'title'
  | 'price'
  | 'modelNumber'
  | 'heroImage'
  | 'productType'
  | 'shippingDetails'
  | 'releaseDate'
>

function isProduct(doc: CardPostData | CardProductData): doc is CardProductData {
  return 'price' in doc && 'modelNumber' in doc
}

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardPostData | CardProductData
  relationTo: 'posts' | 'products'
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, meta, title } = doc || {}
  const { description, image: metaImage } = meta || {}
  const price = doc && isProduct(doc) ? doc.price : undefined
  const heroImage = doc && isProduct(doc) ? doc.heroImage : undefined
  const categories =
    doc && isProduct(doc) ? doc.productCategories : (doc as CardPostData)?.categories

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const href = `/${relationTo}/${slug}`

  return (
    <article className={cn('border border-border rounded-lg overflow-hidden bg-card', className)}>
      <Link href={href}>
        <div className="relative w-full aspect-4/3 hover:opacity-90 transition-opacity">
          {!metaImage && !heroImage && (
            <div className="h-full flex items-center justify-center bg-muted">No image</div>
          )}
          {heroImage && typeof heroImage !== 'string' && (
            <Media
              resource={heroImage}
              size="33vw"
              className="object-cover bg-linear-to-b from-transparent via-primary/30 dark:via-primary/50 to-transparent"
            />
          )}
          {!heroImage && metaImage && typeof metaImage !== 'string' && (
            <Media resource={metaImage} size="33vw" className="object-cover" />
          )}
        </div>
      </Link>
      <div className="p-4">
        {showCategories && hasCategories && (
          <div className="uppercase text-sm mb-4">
            {showCategories && hasCategories && (
              <div>
                {categories?.map((category, index) => {
                  if (typeof category === 'object') {
                    const { title: titleFromCategory } = category

                    const categoryTitle = titleFromCategory || 'Untitled category'

                    const isLast = index === categories.length - 1

                    return (
                      <Fragment key={index}>
                        {categoryTitle}
                        {!isLast && <Fragment>, &nbsp;</Fragment>}
                      </Fragment>
                    )
                  }

                  return null
                })}
              </div>
            )}
          </div>
        )}
        {titleToUse && (
          <div className="prose flex flex-wrap gap-4 justify-between">
            <h3 className="mb-0">
              <Link className="not-prose hover:text-primary transition-colors" href={href}>
                {titleToUse}
              </Link>
            </h3>
            {price && (
              <div className="text-lg font-semibold">
                ${typeof price === 'number' ? price.toFixed(2) : price}
              </div>
            )}
          </div>
        )}
        {relationTo === 'products' && (
          <>
            <div className="flex justify-center items-center mt-4">
              {doc && isProduct(doc) && (
                <div className="ml-4">
                  <AddToCart
                    product={{
                      id: String(doc.id || doc.slug || ''),
                      title: doc.title,
                      price: typeof doc.price === 'number' ? doc.price : parseFloat(doc.price),
                      image:
                        heroImage && typeof heroImage !== 'number' && heroImage.url
                          ? heroImage.url
                          : undefined,
                      releaseDate: doc.releaseDate,
                      shippingDetails: {
                        weight: doc.shippingDetails.weight,
                        length: doc.shippingDetails.length,
                        width: doc.shippingDetails.width,
                        height: doc.shippingDetails.height,
                        stackable: doc.shippingDetails.stackable || undefined,
                        hazmat: doc.shippingDetails.hazmat || undefined,
                        freightClass: doc.shippingDetails.freightClass || undefined,
                        requiresLiftgate: doc.shippingDetails.requiresLiftgate || undefined,
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  )
}
