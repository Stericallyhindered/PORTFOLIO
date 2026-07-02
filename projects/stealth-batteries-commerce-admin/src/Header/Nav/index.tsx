'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SearchIcon, Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/providers/Theme'
import { CartIcon } from '@/components/CartIcon'
import type { Dealer } from '@/payload-types'
import clsx from 'clsx'

interface HeaderNavProps {
  isAdmin: boolean
  dealer: Dealer | null
  isLoading: boolean
}

interface NavItem {
  label: string
  href: string
}

const baseNavItems: NavItem[] = [
  { label: 'Products', href: '/products' },
  { label: 'Batteries', href: '/products/batteries' },
  { label: 'Accessories', href: '/products/accessories' },
  { label: 'Anglers Corner', href: '/anglers-corner' },
  { label: 'The Stealth Angle', href: '/stealth-angle' },
  { label: 'Swag', href: '/products/swag' },
  { label: 'Contact', href: '/contact' },
]

export const HeaderNav: React.FC<HeaderNavProps> = ({ isAdmin, dealer, isLoading }) => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { theme } = useTheme()

  const navItems: NavItem[] = [
    ...baseNavItems,
    isLoading
      ? { label: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0', href: '#' } // Placeholder with non-breaking spaces
      : dealer
        ? { label: 'Dashboard', href: '/dealer/dashboard' }
        : !isAdmin
          ? { label: 'Dealer Log in', href: '/dealer-login' }
          : null,
    ...(isAdmin ? [{ label: 'Admin', href: '/admin' }] : []),
  ].filter((item): item is NavItem => item !== null)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
    // Prevent scrolling when menu is open
    if (!isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }

  const closeMenu = () => {
    setIsOpen(false)
    document.body.style.overflow = 'unset'
  }

  if (isLoading) {
    return (
      <>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-wrap gap-6 lg:gap-8 items-center justify-center">
          {navItems.map(({ label, href }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'lg:text-lg xl:text-xl font-medium transition-colors ',
                  href === '#' ? 'text-transparent' : 'hover:text-primary',
                  isActive ? 'text-primary' : 'text-foreground',
                )}
                onClick={href === '#' ? (e) => e.preventDefault() : undefined}
              >
                {label}
              </Link>
            )
          })}
          <Link href="/search">
            <span className="sr-only">Search</span>
            <SearchIcon className="w-6 lg:w-7 text-primary" aria-label="Search" />
          </Link>

          <CartIcon aria-label="Shopping cart" />
        </nav>

        {/* Mobile Navigation Button */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="p-2 focus:outline-hidden focus:ring-2 focus:ring-primary rounded-lg"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6 text-primary" aria-label="Menu" />
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex flex-wrap gap-6 lg:gap-6 items-center justify-center">
        {navItems.map(({ label, href }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`text-base lg:text-lg xl:text-xl font-semibold transition-colors hover:text-primary font-noto ${
                isActive ? 'text-primary' : 'text-foreground'
              }`}
            >
              {label}
            </Link>
          )
        })}
        <Link href="/search">
          <span className="sr-only">Search</span>
          <SearchIcon className="w-6 lg:w-7 text-primary" />
        </Link>

        <CartIcon aria-label="Shopping cart" />
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <button
          onClick={toggleMenu}
          className="p-2 focus:outline-hidden focus:ring-2 focus:ring-primary rounded-lg"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-primary" />
          ) : (
            <Menu className="w-6 h-6 text-primary" />
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/95 backdrop-blur-xs z-40 overflow-hidden"
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full max-w-sm bg-background shadow-xl flex flex-col overflow-y-auto z-41"
              >
                <div className="flex justify-end p-4">
                  <button
                    onClick={closeMenu}
                    className="p-2 focus:outline-hidden focus:ring-2 focus:ring-primary rounded-lg"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6 text-primary" />
                  </button>
                </div>
                <nav className="flex flex-col px-6 py-8 space-y-6 grow">
                  {navItems.map(({ label, href }) => {
                    const isActive = pathname === href
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={closeMenu}
                        className={`text-xl font-medium transition-colors hover:text-primary uppercase ${
                          isActive ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {label}
                      </Link>
                    )
                  })}
                  <Link
                    href="/search"
                    onClick={closeMenu}
                    className="flex items-center space-x-2 text-xl font-medium"
                  >
                    <SearchIcon className="w-6 text-primary" />
                    <span>Search</span>
                  </Link>
                </nav>
                <div className="mt-auto pb-8 flex flex-col items-center gap-4">
                  <Image
                    src="/assets/SVG/stealth-logo-final-4.svg"
                    alt="Stealth Lithium Batteries Logo"
                    width={386}
                    height={68}
                    className="w-[150px] h-auto"
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} All Rights Reserved</p>
                    <p>
                      Website Built & Managed by{' '}
                      <a
                        href="https://solheim.tech"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Solheim Technologies
                      </a>
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
