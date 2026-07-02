'use client'

import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { RoundLogo } from '../RoundLogo'
import { LightningBolt } from '@/components/icons/LightningBolt'
import { useRouter } from 'next/navigation'

export const PartnersSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/find-dealer?address=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <section className="bg-[#f5f5f5]">
      {/* Top Full Width Lines */}
      <div className="w-full h-[26px] relative overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern
              id="diagonalLinesTop"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(15)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="10"
                stroke="currentColor"
                className="text-black/90"
                strokeWidth="5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalLinesTop)" />
        </svg>
      </div>

      {/* Header Section with Side Lines */}
      <div className="flex flex-col items-center justify-center items-center w-full py-16 mt-16">
        <div className="flex items-center justify-center items-center w-full">
          {/* Left Lines */}
          <div className="flex-1 h-[80px] relative self-center overflow-hidden">
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <pattern
                  id="diagonalLines"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(10)"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="10"
                    stroke="currentColor"
                    className="text-black/90"
                    strokeWidth="5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#diagonalLines)" />
            </svg>
          </div>

          {/* Center Content */}
          <div className="text-center px-4 sm:px-12 shrink-0">
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-[225px] font-apotek-extended font-black italic tracking-wider text-foreground dark:text-black">
              CHARGING
            </h2>
          </div>

          {/* Right Lines */}
          <div className="flex-1 h-[80px] relative self-center overflow-hidden">
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <pattern
                  id="diagonalLines2"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(10)"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="10"
                    stroke="currentColor"
                    className="text-black/90"
                    strokeWidth="5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#diagonalLines2)" />
            </svg>
          </div>
        </div>
        <div className="text-center px-4 sm:px-12 shrink-0">
          <p className="text-xl sm:text-2xl lg:text-[60px] text-primary font-apotek-extended font-bold italic tracking-wide mt-2">
            FORWARD WITH OUR PARTNERS
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Partner Logos Grid */}
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-20">
          {[...Array(15)].map((_, index) => (
            <div key={index} className="aspect-square flex items-center justify-center">
              <div className="relative opacity-100 hover:opacity-50 transition-opacity duration-300 transform hover:scale-110 transition-transform">
                <RoundLogo className="w-auto h-auto" priority="low" loading="lazy" />
              </div>
            </div>
          ))}
        </div>

        {/* Dealer Locator */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h3 className="text-xl sm:text-2xl font-bold text-center mb-8 text-foreground dark:text-black">
            FIND THE NEAREST DEALER NEAR YOU
          </h3>
          <form
            onSubmit={handleSearch}
            className="flex flex-col items-center mb-4 justify-center gap-4 w-full md:flex-row"
          >
            <LightningBolt
              width={64}
              height={64}
              className="fill-primary stroke-primary stroke-1 self-center scale-x-[1]"
            />
            <div className="relative w-full self-center">
              <input
                type="text"
                placeholder="Enter ZIP/Address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 pr-24 sm:pr-32 rounded-full border-2 border-border focus:border-primary focus:outline-hidden text-base sm:text-lg shadow-lg bg-background dark:bg-white text-black"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-4 sm:px-8 py-2 rounded-full hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Search
                  size={16}
                  className="sm:w-5 sm:h-5 text-black"
                  aria-label="Search for a dealer"
                />
                <span className="hidden sm:inline text-black">Search</span>
              </button>
            </div>
            <LightningBolt
              width={64}
              height={64}
              className="fill-primary stroke-primary stroke-1 self-center"
            />
          </form>

          <p className="text-center text-black text-xs sm:text-sm mb-12">
            AUTHORIZED DEALER LOCATOR
          </p>

          {/* Stealth Logo */}
          <div className="flex justify-center pb-28">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <RoundLogo className="w-auto h-auto" priority="low" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Full Width Lines */}
      <div className="w-full h-[26px] relative overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern
              id="diagonalLines3"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(15)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="10"
                stroke="currentColor"
                className="text-black/90"
                strokeWidth="5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalLines3)" />
        </svg>
      </div>
    </section>
  )
}
