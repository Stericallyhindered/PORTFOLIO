import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot Dealer Password',
  description: 'Forgot your Stealth Batteries dealer account password? Request a reset here.',
}

export default function DealerLoginForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
