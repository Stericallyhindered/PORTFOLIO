import { DealerNavbar } from '@/components/DealerNavbar'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Stealth Batteries',
    default: 'Dealer Dashboard',
  },
  description: 'View your dealer dashboard and manage your orders.',
}

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DealerNavbar />
      <main className="min-h-screen bg-background">{children}</main>
    </>
  )
}
