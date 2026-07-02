import { SalesRepNavbar } from '@/components/sales-rep/SalesRepNavbar'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sales Rep Login',
  description: 'Sales Rep Login',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/sales-rep-login',
  },
}

export default function SalesRepLogin({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="min-h-screen bg-background">{children}</main>
    </>
  )
}
