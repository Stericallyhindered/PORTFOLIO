import { getServerSideURL } from '@/utilities/getURL'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Stealth Batteries',
  description: 'Contact Stealth Batteries for any inquiries or support.',
  alternates: {
    canonical: `${getServerSideURL()}/contact`,
  },
  openGraph: {
    title: 'Contact Us',
    description: 'Contact Stealth Batteries for any inquiries or support.',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
