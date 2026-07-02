import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Profile',
  description: 'View and edit your dealer profile. Upload tax exemption certificates.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DealerProfile({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="min-h-screen bg-background">{children}</main>
    </>
  )
}
