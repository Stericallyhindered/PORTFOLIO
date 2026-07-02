import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Dealer Password',
  description: 'Reset your Stealth Batteries dealer account password.',
}

export default function DealerLoginResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
