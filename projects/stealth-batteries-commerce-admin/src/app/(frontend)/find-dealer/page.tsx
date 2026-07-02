import { DealerLocator } from '@/components/DealerLocator'
import { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export const metadata: Metadata = {
  title: 'Find a Dealer',
  description: 'Find a dealer near you to purchase your Stealth Batteries in person.',
  alternates: {
    canonical: `${getServerSideURL()}/find-dealer`,
  },
  openGraph: {
    title: 'Find a Dealer',
    description: 'Find a dealer near you to purchase your Stealth Batteries in person.',
  },
}

export default async function FindDealerPage({
  searchParams,
}: {
  searchParams: Promise<{ address: string }>
}) {
  const { address } = await searchParams

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Find a Dealer Near You</h1>
      <DealerLocator
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        initialAddress={address || ''}
      />
    </div>
  )
}
