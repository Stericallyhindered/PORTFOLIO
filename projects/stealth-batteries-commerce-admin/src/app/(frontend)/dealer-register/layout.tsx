import { getServerSideURL } from '@/utilities/getURL'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dealer Register',
  description: 'Register to become a Stealth Batteries dealer.',
  openGraph: {
    title: 'Dealer Register',
    description: 'Register to become a Stealth Batteries dealer.',
    images: [{ url: `${getServerSideURL()}/og-images/og-dealer-register.webp` }],
    siteName: 'Stealth Batteries',
    locale: 'en_US',
    type: 'website',
    url: 'https://www.stealthbatteries.com/dealer-register',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dealer Register',
    description: 'Register to become a Stealth Batteries dealer.',
    images: [{ url: `${getServerSideURL()}/og-images/og-dealer-register.webp` }],
  },
}

export default function DealerRegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
