import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dealer Registration Successful',
  description: 'Successfully registered as a Stealth Batteries dealer.',
}

export default function DealerRegisterSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
