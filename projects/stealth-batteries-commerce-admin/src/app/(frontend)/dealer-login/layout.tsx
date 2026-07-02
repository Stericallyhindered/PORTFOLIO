import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dealer Login',
  description: 'Login to your Stealth Batteries dealer account.',
}

export default function DealerLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
