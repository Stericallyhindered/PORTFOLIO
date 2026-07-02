import { SalesRepNavbar } from '@/components/sales-rep/SalesRepNavbar'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Stealth Batteries',
    default: 'Sales Rep Dashboard',
  },
  description: 'Sales Rep Dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SalesRepLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SalesRepNavbar />
      <main className="min-h-screen bg-background">{children}</main>
    </>
  )
}
