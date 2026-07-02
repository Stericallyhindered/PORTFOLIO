import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'
import { cookies } from 'next/headers'

import Footer from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { AdminSidebar } from '@/components/admin-sidebar'
import '@/app/(frontend)/globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { redirect } from 'next/navigation'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  // Check if user is an admin
  let isAdmin = false
  if (token) {
    try {
      const adminResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (adminResponse.ok) {
        const adminData = await adminResponse.json()
        isAdmin = adminData.user?.canAccessAdmin
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }
  if (!isAdmin) {
    redirect('/admin/login')
  }

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link rel="stylesheet" href="https://use.typekit.net/bjl0nlw.css" />
      </head>
      <body className="bg-black">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <div className="relative z-50">
              <div className="bg-black border-b border-zinc-800">
                <Header isAdmin={isAdmin} />
              </div>
            </div>
            <div className="flex-1 flex h-full">
              <AdminSidebar>{children}</AdminSidebar>
            </div>
            <div className="bg-black border-t border-zinc-800">
              <Footer />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
export const metadata: Metadata = {
  title: 'Admin Dashboard | Stealth Batteries',
  description: 'Admin Dashboard',
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
}
