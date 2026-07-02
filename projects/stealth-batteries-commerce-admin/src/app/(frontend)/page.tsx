import { LineUpSection } from '@/components/LineUpSection'
import { StealthAngleSection } from '@/components/StealthAngleSection'
import { PartnersSection } from '@/components/PartnersSection'
import { HomePageHero } from '@/components/HomePageHero'
import { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export const metadata: Metadata = {
  title: 'Stealth Batteries',
  description: 'Stealth Batteries is a leading manufacturer of high-quality marine batteries.',
  alternates: {
    canonical: `${getServerSideURL()}/`,
  },
  openGraph: {
    title: 'Stealth Batteries',
    description: 'Stealth Batteries is a leading manufacturer of high-quality marine batteries.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Force static generation
export const dynamic = 'force-static'
export const revalidate = 6000

export default function Home() {
  return (
    <main>
      <HomePageHero />
      <LineUpSection />
      <StealthAngleSection />
      <PartnersSection />
    </main>
  )
}
