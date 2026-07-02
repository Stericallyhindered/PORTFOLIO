import type { Metadata } from 'next/types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import { SecondaryFooter } from '@/components/secondary-footer'
import Image from 'next/image'
import { ProductCard } from '@/components/Product Card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const payload = await getPayload({ config: configPromise })

  // Define product types and their display info
  const productTypes = [
    {
      type: 'battery',
      title: 'Lithium Marine Grade Batteries',
      viewAllLink: '/products/batteries',
    },
    {
      type: 'accessory',
      title: 'Accessories',
      viewAllLink: '/products/accessories',
    },
    {
      type: 'swag',
      title: 'Swag',
      viewAllLink: '/products/swag',
    },
  ]

  // Get products for each type
  const productsByType = await Promise.all(
    productTypes.map(async ({ type }) => {
      const products = await payload.find({
        collection: 'products',
        where: {
          productType: {
            equals: type,
          },
        },
        sort:
          type === 'battery'
            ? ['specifications.voltage.displayedVoltage', 'specifications.ampHours']
            : 'title',
        depth: 1,
        limit: 6, // Limit to 6 products per type
      })

      return {
        type,
        products: products.docs,
      }
    }),
  )

  return (
    <div className="min-h-screen pt-24">
      <PageClient />

      <div className="relative mb-16 z-10 flex flex-col items-center justify-center">
        <div className="flex items-center justify-between w-full">
          {/* Left Lines */}
          <div className="flex-1 h-[36px] relative self-center">
            <svg width="100%" height="100%" className="absolute inset-0 z-1">
              <defs>
                <pattern
                  id="diagonalLinesAngle"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(15)"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="10"
                    stroke="currentColor"
                    className="text-black/70 dark:text-[#3C4C5B]"
                    strokeWidth="4"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#diagonalLinesAngle)" />
            </svg>
          </div>

          {/* Center Content */}
          <div className="flex flex-col items-center justify-center text-center mx-auto px-4 pr-6">
            <h1 className="text-6xl lg:text-8xl font-black italic font-apotek-extended">
              <span className="text-primary">OUR</span>{' '}
              <span className="text-foreground">PRODUCTS</span>
            </h1>
          </div>

          {/* Right Lines */}
          <div className="flex-1 h-[36px] relative self-center">
            <svg width="100%" height="100%" className="absolute inset-0 z-1">
              <defs>
                <pattern
                  id="diagonalLinesAngle"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(15)"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="10"
                    stroke="currentColor"
                    className="text-black/70 dark:text-[#3C4C5B]"
                    strokeWidth="4"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#diagonalLinesAngle)" />
            </svg>
          </div>
        </div>
        <p className="text-primary text-lg lg:text-3xl italic capitalize font-apotek-extended">
          Expect the best, get the best!
        </p>
      </div>

      <div className="relative container my-8 mx-auto z-10">
        <h3 className="text-foreground text-center uppercase text-lg font-bold mb-4 font-apotek-extended">
          Discover Our Premium Line of Marine <span className="text-primary">Batteries,</span>{' '}
          Accessories, and <span className="text-primary">More!</span>
        </h3>
      </div>

      {/* Product Type Sections */}
      <div className="relative container z-10 space-y-16">
        {productsByType.map(({ type, products }) => {
          const typeInfo = productTypes.find((t) => t.type === type)
          if (!typeInfo || products.length === 0) return null

          return (
            <div key={type} className="relative flex flex-col items-center justify-center gap-12">
              <section className="relative">
                <h2 className="text-4xl font-bold text-center mb-8 font-apotek-extended">
                  <span className="text-foreground">
                    {typeInfo.title.split(/(batteries)/i).map((part, index) =>
                      part.toLowerCase() === 'batteries' ? (
                        <span key={index} className="text-primary">
                          {part}
                        </span>
                      ) : part.toLowerCase() === 'accessories' ? (
                        <span key={index} className="text-primary">
                          {part}
                        </span>
                      ) : (
                        part
                      ),
                    )}
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      doc={product}
                      relationTo="products"
                      showCategories={false}
                      className="h-full"
                    />
                  ))}
                </div>
                <div className="flex justify-center mt-8">
                  <Link href={typeInfo.viewAllLink}>
                    <Button className="cursor-pointer">View All</Button>
                  </Link>
                </div>
              </section>
              {/* Bottom Full Width Lines */}
              <div className="w-screen relative min-h-[26px]">
                <div className="h-[26px] w-full absolute top-0 left-0">
                  <svg width="100%" height="100%" className="absolute inset-0">
                    <defs>
                      <pattern
                        id="diagonalLinesAngle"
                        width="10"
                        height="10"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(15)"
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="10"
                          stroke="currentColor"
                          className="text-black/70 dark:text-[#3C4C5B]"
                          strokeWidth="4"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#diagonalLinesAngle)" />
                  </svg>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/SVG/stealth-hero-kraken.svg"
          alt="Products Background"
          fill
          className="object-cover object-top bg-gradient-to-b from-black via-black to-[#1A1A1A]"
        />
      </div>
      <div className="relative z-10">
        <SecondaryFooter />
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Our Products',
    description: 'Browse our collection of high-quality marine batteries, accessories, and more.',
    alternates: {
      canonical: `${getServerSideURL()}/products`,
    },
    openGraph: {
      title: 'Our Products',
      description: 'Browse our collection of high-quality marine batteries, accessories, and more.',
    },
  }
}
