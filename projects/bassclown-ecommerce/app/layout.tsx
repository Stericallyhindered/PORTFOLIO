// Import drizzle-build-patch FIRST to ensure JSON.parse is patched before any other code runs
import '@/lib/drizzle-build-patch';

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PasswordProtection } from '@/components/PasswordProtection';
import { ConditionalLayout } from '@/components/ConditionalLayout';
import { Providers } from '@/lib/providers';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Bass Clown Co | Professional Fishing Video Production',
    template: '%s | Bass Clown Co',
  },
  description: 'Professional video production for the fishing industry. We create engaging content that showcases your brand and products with a touch of humor.',
  keywords: 'fishing videos, fishing industry, video production, brand development, fishing content, marketing',
  metadataBase: new URL('https://bassclown.com'),
  alternates: {
    canonical: 'https://bassclown.com',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Bass Clown Co - Professional Fishing Video Production',
    description: 'Professional video production for the fishing industry. We create engaging content that showcases your brand and products with a touch of humor.',
    images: [
      {
        url: '/images/assets/bass-clown-co-fish-chase.png',
        width: 1200,
        height: 630,
        alt: 'Bass Clown Co',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <Providers>
          <PasswordProtection>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </PasswordProtection>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
