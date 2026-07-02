'use client'
import { cn } from '@/utilities/ui'
import React, { useState } from 'react'
import type { Product } from '@/payload-types'
import { Media } from '@/components/Media'
import { ExpandedProductCard } from './Expanded Product Card'
import { AddToCart } from '../AddToCart'
import Image from 'next/image'
import { useDealer } from '@/hooks/useDealer'
import { getDealerProductPrice } from '@/utilities/getDealerProductPrice'

export type CardProductData = Pick<
  Product,
  | 'id'
  | 'slug'
  | 'displayName'
  | 'subtitle'
  | 'productCategories'
  | 'meta'
  | 'title'
  | 'accessoryDetails'
  | 'price'
  | 'compareAtPrice'
  | 'modelNumber'
  | 'heroImage'
  | 'specifications'
  | 'productType'
  | 'shippingDetails'
  | 'inventory'
  | 'releaseDate'
  | 'dealerPrice'
>

function isProduct(doc: CardProductData): doc is CardProductData {
  return 'price' in doc && 'modelNumber' in doc
}

function highlightLightning(text?: string) {
  if (!text) return null
  const regex = /(lightning)/gi
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="text-white">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

function formatLastWordPrimary(text?: string) {
  if (!text) return null
  const words = text.trim().split(/\s+/)
  if (words.length === 1) return <span className="text-primary">{words[0]}</span>
  return (
    <>
      <span className="text-white">{words.slice(0, -1).join(' ') + ' '}</span>
      <span className="text-primary">{words[words.length - 1]}</span>
    </>
  )
}

function renderHullshotText() {
  return (
    <span>
      <span className="text-white">Hull</span>
      <span className="text-primary">shot</span>
    </span>
  )
}

export const ProductCard: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardProductData | Product
  relationTo: 'posts' | 'products'
  showCategories?: boolean
  title?: string
}> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, meta, title } = doc || {}
  const { image: metaImage } = meta || {}
  const { dealer, isLoading: dealerLoading } = useDealer()
  const isDealer = dealer && dealer.verified
  const price = doc && isProduct(doc) ? Number(doc.price) : 0
  const compareAtPrice = doc && isProduct(doc) ? Number(doc.compareAtPrice) : 0
  const dealerPrice =
    doc && isProduct(doc) && 'dealerPrice' in doc ? Number(doc.dealerPrice) : undefined
  const heroImage = doc && isProduct(doc) ? doc.heroImage : undefined
  const categories = doc && isProduct(doc) ? doc.productCategories : []

  const priceToShow =
    doc && isProduct(doc)
      ? getDealerProductPrice({
          product: { id: String(doc.id), price, dealerPrice },
          dealer: isDealer ? (dealer as any) : undefined,
        })
      : price

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title

  return (
    <div className="relative flex flex-col gap-0 flex-1 group h-full">
      <div className="flex flex-col gap-0 flex-1 w-full h-full">
        <article
          className={cn(
            'border border-muted-foreground overflow-hidden bg-transparent cursor-pointer group-hover:border-primary transition-colors',
            className,
          )}
          onClick={() => setIsExpanded(true)}
        >
          <div className="relative flex items-center justify-center py-2 border-b border-muted-foreground group-hover:border-primary transition-colors">
            <h3 className="text-primary text-lg text-center font-medium font-apotek-extended group-hover:text-primary transition-colors">
              {isDealer ? (
                <span>${priceToShow.toFixed(2)}</span>
              ) : (
                <>
                  {compareAtPrice && compareAtPrice > price ? (
                    <>
                      <span className="text-muted-foreground line-through">
                        ${compareAtPrice.toFixed(2)}
                      </span>
                      <span className="text-green-600"> ${price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span>${price.toFixed(2)}</span>
                  )}
                </>
              )}
            </h3>
          </div>
          <div className="relative flex flex-col justify-between">
            {doc &&
            isProduct(doc) &&
            doc.specifications?.voltage?.displayedVoltage &&
            doc.productType === 'battery' ? (
              <div className=" top-0 left-0 right-0 pt-4 flex justify-center">
                <div className="text-6xl font-bold font-apotek-extended">
                  <span>{Math.floor(doc.specifications.voltage.displayedVoltage)}</span>
                  <span className="text-primary">V</span>
                </div>
              </div>
            ) : doc?.productType === 'accessory' && doc?.displayName === 'Hullshot' ? (
              <div className=" top-0 left-0 right-0 pt-4 flex justify-center">
                <h3 className="font-apotek-extended font-bold text-6xl text-center uppercase">
                  {doc?.displayName === 'Hullshot' && renderHullshotText()}
                </h3>
              </div>
            ) : doc?.productType === 'accessory' &&
              doc?.accessoryDetails?.accessoryType === 'charger' ? (
              <div className=" top-0 left-0 right-0 pt-4 flex justify-center">
                <div className="text-6xl font-bold font-apotek-extended">
                  <span>{Math.floor(doc?.specifications?.voltage?.displayedVoltage || 0)}</span>
                  <span className="text-primary">V</span>
                </div>
              </div>
            ) : (
              <div className=" top-0 left-0 right-0 pt-4 flex justify-center">
                <h3 className="font-apotek-extended font-bold text-6xl text-center uppercase">
                  {doc?.displayName === 'Hullshot'
                    ? renderHullshotText()
                    : formatLastWordPrimary(doc?.displayName || doc?.title)}
                </h3>
              </div>
            )}
            <div className="relative w-full aspect-[3/4] flex flex-col items-center justify-center">
              {!metaImage && !heroImage && (
                <div className="h-full flex items-center justify-center bg-muted">No image</div>
              )}
              {heroImage && typeof heroImage !== 'string' && (
                <Media resource={heroImage} size="33vw" className="object-cover bg-transparent" />
              )}
              {!heroImage && metaImage && typeof metaImage !== 'string' && (
                <Media resource={metaImage} size="33vw" className="object-cover" />
              )}
            </div>
            <div className="my-4 absolute bottom-0 left-0 right-0">
              <div className="flex flex-col items-center justify-center">
                {doc && isProduct(doc) && doc.specifications?.ampHours ? (
                  <>
                    {doc?.specifications?.modelFamily && (
                      <h3 className="text-primary font-apotek-extended text-2xl uppercase">
                        {doc.specifications.modelFamily}
                      </h3>
                    )}
                    <div className="text-5xl text-center font-bold font-apotek-extended text-white">
                      {doc.specifications.ampHours}
                      <span className="text-primary">AH</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            {doc && isProduct(doc) && doc.productType === 'accessory' && (
              <div className="flex flex-col items-center justify-between relative h-full flex-1">
                {doc?.accessoryDetails?.accessoryType === 'charger' ? (
                  <h3 className="font-apotek-extended font-bold text-2xl text-center uppercase">
                    {formatLastWordPrimary(doc?.displayName ?? undefined)}
                  </h3>
                ) : (
                  <h3 className="font-apotek-extended font-bold text-2xl text-center uppercase">
                    {formatLastWordPrimary(doc?.subtitle ?? undefined)}
                  </h3>
                )}
                {doc?.modelNumber && (
                  <h4 className="text-primary font-noto font-bold text-lg text-center uppercase">
                    {doc?.modelNumber}
                  </h4>
                )}
              </div>
            )}
          </div>
        </article>
        <div className="relative flex flex-col border md:flex-row justify-evenly gap-4 border-muted-foreground group-hover:border-primary transition-colors">
          {doc && isProduct(doc) && (
            <>
              <div className="h-[60px] w-fit">
                <AddToCart
                  product={{
                    id: String(doc.id || doc.slug || ''),
                    title: doc.title,
                    price: priceToShow,
                    image:
                      doc.heroImage &&
                      typeof doc.heroImage === 'object' &&
                      'url' in doc.heroImage &&
                      doc.heroImage.url
                        ? doc.heroImage.url
                        : undefined,
                    inventory: doc.inventory,
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
            </>
          )}
        </div>
        {isExpanded && doc && (
          <ExpandedProductCard
            product={doc as Product}
            onClose={() => setIsExpanded(false)}
            className="animate-in fade-in duration-200"
          />
        )}
      </div>
    </div>
  )
}
