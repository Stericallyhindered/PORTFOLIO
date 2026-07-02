import { Metadata } from 'next'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/getPayload'
import { ProductCollectionArchive } from '@/components/Product CollectionArchive'
import Image from 'next/image'
import { SecondaryFooter } from '@/components/secondary-footer'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Batteries() {
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
        equals: 'Lithium Marine Grade Batteries',
      },
    },
    sort: ['specifications.voltage.displayedVoltage', 'specifications.ampHours'],
    depth: 1,
  })

  if (!products || products.length === 0) {
    return (
      <div className="relative min-h-screen dark:bg-black pt-24">
        <div className="relative z-10">
          <div className="container">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4 font-apotek-extended">
                <span className="text-white">STEALTH LITHIUM MARINE GRADE</span>{' '}
                <span className="text-primary">BATTERIES</span>
              </h1>
              <p className="text-primary text-xl italic capitalize font-noto">
                Enhance Your Battery Experience!
              </p>
            </div>
            <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
              No batteries are currently available.
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
            className="object-cover object-top"
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
              <span className="text-white">STEALTH LITHIUM MARINE GRADE</span>{' '}
              <span className="text-primary">BATTERIES</span>
            </h1>
            <p className="text-primary text-xl italic font-semibold capitalize font-noto">
              Get the best, Expect the best!
            </p>
          </div>
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
  title: 'Lithium Marine Grade Batteries',
  description: 'Browse our collection of high-quality lithium marine grade batteries',
  alternates: {
    canonical: `${getServerSideURL()}/products/batteries`,
  },
  openGraph: {
    title: 'Lithium Marine Grade Batteries',
    description: 'Browse our collection of high-quality lithium marine grade batteries',
  },
}
