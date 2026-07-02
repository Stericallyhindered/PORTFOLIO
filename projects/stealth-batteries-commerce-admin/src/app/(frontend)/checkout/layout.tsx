import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Checkout with Stealth Batteries.',
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
