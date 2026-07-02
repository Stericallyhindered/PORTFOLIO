import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { Post, Product } from '@/payload-types'
import { Search } from '@/search/Component'
import PageClient from './page.client'
import { Card, CardPostData, CardProductData } from '@/components/Card'

type Args = {
  searchParams: Promise<{
    q: string
  }>
}

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: query } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })

  const searchResults = await payload.find({
    collection: 'search',
    depth: 2,
    limit: 100,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      doc: true,
    },
    pagination: true,
    ...(query
      ? {
          where: {
            or: [
              {
                title: {
                  like: query,
                },
              },
              {
                'meta.description': {
                  like: query,
                },
              },
              {
                'meta.title': {
                  like: query,
                },
              },
              {
                slug: {
                  like: query,
                },
              },
            ],
          },
        }
      : {
          sort: '-createdAt', // Show most recent items when no search
        }),
  })

  // Separate and map posts and products
  const posts = searchResults.docs
    .filter((doc) => doc.doc?.relationTo === 'posts')
    .map((doc) => ({
      title: doc.title || '',
      slug: doc.slug || '',
      meta: doc.meta,
      categories: doc.categories,
    })) as CardPostData[]

  const products = searchResults.docs
    .filter((doc) => doc.doc?.relationTo === 'products')
    .map((doc) => {
      const value = doc.doc.value as Product

      // Try to get the full product data
      const product = {
        id: value.id,
        title: doc.title || '',
        slug: doc.slug || '',
        meta: doc.meta,
        productCategories: doc.categories,
        price: value.price,
        modelNumber: value.modelNumber,
        heroImage: typeof value.heroImage === 'number' ? { id: value.heroImage } : value.heroImage,
        productType: value.productType,
        shippingDetails: value.shippingDetails,
        inventory: value.inventory,
        releaseDate: value.releaseDate,
      }
      return product
    }) as CardProductData[]

  const hasResults = posts.length > 0 || products.length > 0

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none text-center">
          <h1 className="mb-8 lg:mb-16">Search</h1>

          <div className="max-w-[50rem] mx-auto">
            <Search />
          </div>
        </div>
      </div>

      {query ? (
        hasResults ? (
          <div className="container">
            {products.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold mb-8">Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((product) => (
                    <Card key={product.id} doc={product} relationTo="products" />
                  ))}
                </div>
              </div>
            )}

            {posts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-8">Posts</h2>
                <CollectionArchive posts={posts} />
              </div>
            )}
          </div>
        ) : (
          <div className="container text-center">
            <p className="text-lg text-muted-foreground">
              No results found for &quot;{query}&quot;
            </p>
          </div>
        )
      ) : (
        <div className="container">
          {(posts.length > 0 || products.length > 0) && (
            <>
              {products.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-2xl font-bold mb-8">Recent Products</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => (
                      <Card key={product.id} doc={product} relationTo="products" />
                    ))}
                  </div>
                </div>
              )}

              {posts.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-8">Recent Posts</h2>
                  <CollectionArchive posts={posts} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { q } = await searchParamsPromise
  return {
    title: q ? `Search results for "${q}" - Stealth Batteries` : 'Search - Stealth Batteries',
  }
}
