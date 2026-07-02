import { SalesRepNavbar } from '@/components/sales-rep/SalesRepNavbar'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sales Rep Profile',
  description: 'View and edit your sales rep profile.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SalesRepProfile({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SalesRepNavbar />
      <main className="min-h-screen bg-background">{children}</main>
    </>
  )
}
