import { Metadata } from 'next'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/getPayload'

import { ProductCollectionArchive } from '@/components/Product CollectionArchive'
import Image from 'next/image'
import { SecondaryFooter } from '@/components/secondary-footer'
import { getServerSideURL } from '@/utilities/getURL'

export default async function Swag() {
  const payload = await getPayloadClient()

  // First, let's check what product categories exist
  const { docs: categories } = await payload.find({
    collection: 'productCategories',
    depth: 1,
  })

  const { docs: products } = await payload.find({
    collection: 'products',
    where: {
      'productCategories.title': {
        equals: 'Swag',
      },
    },
    depth: 1,
  })

  if (!products || products.length === 0) {
    return (
      <div className="min-h-screen dark:bg-black pt-24">
        <div className="relative z-10">
          <div className="container">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4 font-apotek-extended">
                <span className="text-foreground">STEALTH</span>{' '}
                <span className="text-primary">SWAG</span>
              </h1>
              <p className="text-primary text-xl italic font-semibold capitalize font-noto">
                Show Your Stealth Pride!
              </p>
            </div>
            <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
              No swag items are currently available.
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <SecondaryFooter />
        </div>
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/SVG/stealth-hero-kraken.svg"
            alt="Products Background"
            fill
            className="object-cover object-top bg-gradient-to-b from-black via-black to-[#1A1A1A]"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dark:bg-black pt-24">
      <div className="relative z-10">
        <div className="container mb-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 font-apotek-extended">
              <span className="text-foreground">STEALTH</span>{' '}
              <span className="text-primary">SWAG</span>
            </h1>
            <p className="text-primary text-xl italic font-semibold capitalize font-noto">
              Show Your Stealth Pride!
            </p>
          </div>
        </div>

        <div className="container my-8">
          <h3 className="text-foreground text-center uppercase text-lg font-bold mb-4 font-apotek-extended">
            Rock The Latest Stealth Batteries Gear
          </h3>
        </div>

        <ProductCollectionArchive products={products} />
      </div>
      <div className="relative z-10">
        <SecondaryFooter />
      </div>
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/SVG/stealth-hero-kraken.svg"
          alt="Products Background"
          fill
          className="object-cover object-top bg-gradient-to-b from-black via-black to-[#1A1A1A]"
        />
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Swag',
  description: 'Browse our collection of Stealth Batteries branded merchandise and swag',
  alternates: {
    canonical: `${getServerSideURL()}/products/swag`,
  },
  openGraph: {
    title: 'Swag',
    description: 'Browse our collection of Stealth Batteries branded merchandise and swag',
  },
}
