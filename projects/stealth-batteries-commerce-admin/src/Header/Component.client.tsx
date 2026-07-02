'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useTheme } from '@/providers/Theme'

import { HeaderNav } from './Nav'
import { CartIcon } from '@/components/CartIcon'
import { useDealer } from '@/hooks/useDealer'
import clsx from 'clsx'

interface HeaderClientProps {
  isAdmin: boolean
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ isAdmin }) => {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  const { dealer, isLoading } = useDealer()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (pathname === '/') {
      setHeaderTheme('dark')
    } else {
      setHeaderTheme('light')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const headerContent = (
    <header className="relative z-20 bg-transparent">
      <div className="container mx-auto">
        <div className="py-4 md:py-6">
          {/* Desktop Layout */}
          <div className="hidden md:flex flex-col items-center">
            <Link href="/" className="mb-6">
              <Image
                src="/assets/SVG/Stealth final logo-12.svg"
                alt="Stealth Lithium Batteries Logo"
                width={386}
                height={68}
                priority
                className="bg-transparent w-[400px] lg:w-[500px] h-full"
              />
            </Link>
            <div className="flex items-center justify-center gap-8 w-full">
              <HeaderNav isAdmin={isAdmin} dealer={dealer} isLoading={isLoading} />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="flex md:hidden items-center justify-between">
            <Link href="/" className="shrink-0">
              <Image
                src="/assets/SVG/stealth-logo-final-4.svg"
                alt="Stealth Lithium Batteries Logo"
                width={386}
                height={68}
                priority
                className="bg-transparent w-[200px] h-full"
                aria-label="Stealth Lithium Batteries Logo"
              />
            </Link>
            <div className="flex items-center gap-4">
              <CartIcon aria-label="Shopping cart" />
              <HeaderNav isAdmin={isAdmin} dealer={dealer} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )

  return headerContent
}
