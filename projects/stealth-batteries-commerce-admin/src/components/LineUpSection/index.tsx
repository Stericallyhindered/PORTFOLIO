'use client'

import React from 'react'

import CircularCarousel from '../batter-lineup-carousel/component'
import Link from 'next/link'
import Image from 'next/image'

export const LineUpSection: React.FC = () => {
  return (
    <section className="relative bg-linear-to-b from-primary/5 via-black to-black text-foreground text-white py-8 md:py-20">
      <Image
        src="/assets/PNG/stealth-hero-bubbles.png"
        alt="Lineup Background"
        width={2560}
        height={1440}
        className="object-contain object-top w-auto h-auto absolute inset-0 w-full pt-12"
        priority
        quality={85}
      />
      <div className="container mx-auto px-4">
        {/* Header Content */}
        <div className="relative w-full h-48"></div>

        <div className="relative w-full mb-24 lg:my-auto mx-auto h-[600px] md:h-auto">
          {/* Central Battery Display */}
          <div className="relative w-full h-full">
            <CircularCarousel />
          </div>
        </div>

        {/* Shop Now Button */}
        <div className="text-center pt-8 mt-8 md:mt-16 md:pt-16">
          <Link href="/products" aria-label="Shop our line of products">
            <button className="bg-primary text-white px-5 py-3 text-4xl hover:bg-primary/80 transition-colors rounded-md shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              Shop Now
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
