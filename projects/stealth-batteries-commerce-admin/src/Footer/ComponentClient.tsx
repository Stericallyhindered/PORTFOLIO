'use client'
import Link from 'next/link'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Facebook, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react'
import type { Footer } from '@/payload-types'

export function FooterClient({ data }: { data: Footer }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const footerContent = (
    <footer
      className="mt-auto border-t border-border bg-black text-white z-10"
      itemScope
      itemType="http://schema.org/LocalBusiness"
    >
      <div className="container py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Logo and About */}
          <div className="space-y-6 text-center md:text-left">
            <Link className="flex items-center justify-center md:justify-start w-full" href="/">
              {mounted && (
                <div className="w-full max-w-[300px] md:max-w-none">
                  <Image
                    src="/assets/SVG/Stealth final logo-12.svg"
                    alt="Stealth Lithium Batteries Logo"
                    width={386}
                    height={68}
                    className="w-full h-auto"
                    itemProp="logo"
                    quality={85}
                  />
                </div>
              )}
            </Link>
            <p className="text-sm text-gray-300" itemProp="description">
              Leading the charge in advanced lithium battery technology. Powering your fishing
              adventures with reliable, high-performance energy solutions.
            </p>
            <div className="flex space-x-4 justify-center md:justify-start">
              <Link
                href="https://facebook.com"
                className="hover:text-red-500 text-gray-300"
                aria-label="Facebook"
              >
                <Facebook size={24} />
              </Link>
              <Link
                href="https://instagram.com"
                className="hover:text-red-500 text-gray-300"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </Link>
              <Link
                href="https://youtube.com"
                className="hover:text-red-500 text-gray-300"
                aria-label="YouTube"
              >
                <Youtube size={24} />
              </Link>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <nav className="flex flex-col space-y-3">
              <Link href="/products" className="hover:text-red-500 text-gray-300 text-sm">
                Products
              </Link>
              <Link href="/products/batteries" className="hover:text-red-500 text-gray-300 text-sm">
                Batteries
              </Link>
              <Link
                href="/products/accessories"
                className="hover:text-red-500 text-gray-300 text-sm"
              >
                Accessories
              </Link>
              <Link href="/anglers-corner" className="hover:text-red-500 text-gray-300 text-sm">
                Anglers Corner
              </Link>
              <Link href="/stealth-angle" className="hover:text-red-500 text-gray-300 text-sm">
                The Stealth Angle
              </Link>
              <Link href="/products/swag" className="hover:text-red-500 text-gray-300 text-sm">
                Swag
              </Link>
              <Link href="/contact" className="hover:text-red-500 text-gray-300 text-sm">
                Contact
              </Link>
              <Link href="/dealer-login" className="hover:text-red-500 text-gray-300 text-sm">
                Dealer Login
              </Link>
              <Link href="/find-dealer" className="hover:text-red-500 text-gray-300 text-sm">
                Dealer Locator
              </Link>
            </nav>
          </div>

          {/* Column 3: Legal */}
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <nav className="flex flex-col space-y-3">
              <Link
                href="/legal/privacy-policy"
                className="hover:text-red-500 text-gray-300 text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/legal/terms-of-service"
                className="hover:text-red-500 text-gray-300 text-sm"
              >
                Terms of Service
              </Link>
              <Link
                href="/legal/refund-policy"
                className="hover:text-red-500 text-gray-300 text-sm"
              >
                Refund Policy
              </Link>
              <Link
                href="/legal/shipping-policy"
                className="hover:text-red-500 text-gray-300 text-sm"
              >
                Shipping Policy
              </Link>
              <Link
                href="/legal/website-accessibility-statement"
                className="hover:text-red-500 text-gray-300 text-sm"
              >
                Accessibility Statement
              </Link>
              <Link
                href="/warranty"
                className="hover:text-red-500 text-gray-300 text-sm"
                aria-label="10 Year Warranty"
              >
                Warranty
              </Link>
            </nav>
          </div>

          {/* Column 4: Contact Us */}
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm justify-center md:justify-start">
                <MapPin size={18} className="text-red-500" />
                <div
                  className="text-gray-300"
                  itemProp="address"
                  itemScope
                  itemType="https://schema.org/PostalAddress"
                >
                  <span itemProp="streetAddress">3266 W Galveston Dr #102</span>,<br />
                  <span itemProp="addressLocality">Apache Junction</span>,
                  <span itemProp="addressRegion"> AZ </span>
                  <span itemProp="postalCode">85120</span>
                  <span itemProp="addressCountry" className="sr-only">
                    USA
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm justify-center md:justify-start">
                <Phone size={18} className="text-red-500" />
                <Link href="tel:+18772772025" className="text-gray-300 hover:text-primary/80">
                  <span itemProp="telephone">(877) 277-2025</span>
                </Link>
              </div>
              <div className="flex items-center space-x-3 text-sm justify-center md:justify-start">
                <Mail size={18} className="text-red-500" />
                <Link
                  href="mailto:sales@stealthbatteries.com"
                  className="text-gray-300 hover:text-primary/80"
                >
                  <span itemProp="email">sales@stealthbatteries.com</span>
                </Link>
              </div>
            </div>
            <div className="flex justify-center md:justify-start mt-4">
              <Link href="/sales-rep-login" className="hover:text-red-500 text-gray-300 text-sm">
                Sales Representatives
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
              <p className="text-sm text-gray-300 font-semibold">
                © <span itemProp="copyrightYear">2025</span>{' '}
                <span itemProp="name">Stealth Batteries</span>. All rights reserved.
              </p>
            </div>
            <p className="text-sm text-gray-300 font-semibold">
              Website Built and Managed by{' '}
              <Link
                href="https://solheimtech.com"
                target="_blank"
                className="text-primary hover:text-primary/80 font-semibold"
              >
                Solheim Technologies
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )

  if (!mounted) return footerContent

  return footerContent
}
