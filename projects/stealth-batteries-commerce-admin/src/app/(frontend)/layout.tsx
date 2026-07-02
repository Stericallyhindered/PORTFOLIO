import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'
import { cookies } from 'next/headers'
import { notoSans } from '../fonts'

import { AdminBar } from '@/components/AdminBar'
import Footer from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  // Check if user is an admin
  let isAdmin = false
  if (token) {
    try {
      // First try dealers/me for dealer routes
      const dealerResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/me`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })

      if (dealerResponse.ok) {
        // If dealer exists, they are not an admin
        isAdmin = false
      } else {
        // If not a dealer, check if they are an admin user
        const adminResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
        })
        if (adminResponse.ok) {
          const adminData = await adminResponse.json()
          isAdmin = adminData.user?.canAccessAdmin
        }
      }
    } catch (error) {
      console.error('Error checking admin/dealer status:', error)
    }
  }

  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable, notoSans.variable, 'overflow-x-hidden')}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link rel="stylesheet" href="https://use.typekit.net/bjl0nlw.css" />
      </head>
      <body className="overflow-x-hidden relative">
        <Providers>
          {isAdmin && (
            <AdminBar
              adminBarProps={{
                preview: isEnabled,
              }}
            />
          )}
          <Header isAdmin={isAdmin} />
          {children}
          <Footer />
          <Analytics />
          <GoogleAnalytics gaId="G-KTHP78HHBZ" />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: {
    default: 'Stealth Batteries | Lithium Marine Grade Batteries',
    template: '%s | Stealth Batteries',
  },
  description:
    'Stealth Batteries is a leading manufacturer of high-quality marine batteries and accessories.',
  keywords: [
    'marine batteries',
    'lithium batteries',
    'marine battery',
    'lithium marine battery',
    'stealth batteries',
    'stealth battery',
    'stealth marine battery',
  ],
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
