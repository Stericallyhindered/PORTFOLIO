import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { ProductHero } from '@/heros/ProductHero'
import { generateMeta } from '@/utilities/generateMeta'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { ProductSpecs } from '@/components/ProductSpecs/component'
import WaveBackground from '../../../../../public/assets/SVG/stealth-hero-kraken.svg'
import RelatedProducts from '@/components/RelatedProducts/related-products'
import { ProductTitleColumn } from '@/components/ProductSpecs/battery-accessory-swag-specs/product-title-column'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BreadcrumbsJsonLd } from '@/components/ui/breadcrumbs-jsonld'
import { ProductSchema } from '@/components/ui/product-schema'

export const dynamic = 'force-static'
export const revalidate = 600

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const products = await payload.find({
    collection: 'products',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = products.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function ProductPage({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const url = '/products/' + slug
  const product = await queryProductBySlug({ slug })

  if (!product) return <PayloadRedirects url={url} />

  return (
    <>
      <BreadcrumbsJsonLd
        productType={product.productType}
        productTitle={product.title}
        productSlug={product.slug}
      />
      <ProductSchema product={product} />
      <div
        className="absolute inset-0 w-full h-full z-[-1] flex flex-col transform bg-top bg-fixed bg-no-repeat bg-cover bg-origin-content"
        style={{
          backgroundImage: `url(${WaveBackground.src})`,
        }}
      />
      <article className="pb-12 pt-6 container">
        {/* Breadcrumb */}
        <div className="mb-12">
          <Breadcrumbs
            productType={product.productType}
            productTitle={product.title}
            productSlug={product.slug}
          />
        </div>
        {/* Allows redirects for valid pages too */}
        <PayloadRedirects disableNotFound url={url} />
        {draft && <LivePreviewListener />}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <ProductHero product={product} />
          <div className="z-10 relative lg:col-span-2">
            <ProductTitleColumn product={product} />
          </div>
        </div>
        <ProductSpecs product={product} />
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <RelatedProducts product={product} />
        )}
      </article>
    </>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const product = await queryProductBySlug({ slug })

  return generateMeta({ doc: product })
}

const queryProductBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2, // Increase depth to properly populate nested fields
  })

  return result.docs?.[0] || null
})
