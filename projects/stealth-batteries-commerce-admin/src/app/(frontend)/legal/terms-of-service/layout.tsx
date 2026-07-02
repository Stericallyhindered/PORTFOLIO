import { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export const metadata: Metadata = {
  title: 'Terms of Service | Stealth Batteries',
  description: 'Terms of Service for Stealth Batteries website and products',
  alternates: {
    canonical: `${getServerSideURL()}/legal/terms-of-service`,
  },
  openGraph: {
    title: 'Terms of Service',
    description: 'Terms of Service for Stealth Batteries website and products',
  },
}

export default function TermsOfServiceLayout({ children }: { children: React.ReactNode }) {
  return children
}
