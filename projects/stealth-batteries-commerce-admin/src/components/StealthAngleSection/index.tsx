'use client'

import React from 'react'
import Image from 'next/image'
import LightningBolt from '../icons/LightningBolt'

export const StealthAngleSection: React.FC = () => {
  return (
    <section className="bg-background dark:bg-black text-foreground dark:text-white py-20 relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 object-top">
        <Image
          src="/assets/PNG/stealth-section-background.png"
          alt="Wave background"
          fill
          className="object-cover aspect-video object-center w-full h-full xl:block hidden"
          quality={66}
          loading="lazy"
        />
        <Image
          src="/assets/PNG/stealth-section-background.png"
          alt="Wave background"
          fill
          className="object-cover aspect-video object-center w-auto h-auto xl:hidden block opacity-60"
          quality={66}
          loading="lazy"
        />
      </div>

      {/* Header Section with Side Lines */}
      <div className="relative flex items-center justify-center">
        {/* Left Lines */}
        <div className="flex-1 h-[80px] relative self-start mt-6 w-full">
          <svg width="100%" height="100%" className="absolute inset-0 z-1 text-[#3C4B5B]">
            <defs>
              <pattern
                id="diagonalLinesAngle"
                width="12"
                height="12"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(10)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="20"
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="8"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonalLinesAngle)" />
          </svg>
        </div>

        {/* Center Content */}
        <div className="text-center px-4 sm:px-12 shrink-0 relative z-10">
          <h2 className="text-3xl md:text-6xl xl:text-[125px] font-apotek-extended font-black mb-2 sm:mb-3 text-center italic">
            <span className="text-primary">THE</span> STEALTH ANGLE
          </h2>
          <p className="text-sm md:text-xl lg:text-2xl text-white font-noto font-semibold">
            WHY THE PROS CHOOSE STEALTH BATTERIES!
          </p>
        </div>

        {/* Right Lines */}
        <div className="flex-1 h-[80px] relative self-start mt-6">
          <svg width="100%" height="100%" className="absolute inset-0 z-1 text-[#3C4B5B]">
            <defs>
              <pattern
                id="diagonalLinesAngle2"
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
                  fill="currentColor"
                  strokeWidth="8"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonalLinesAngle2)" />
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 relative ">
        <div className="grid gap-12 items-center">
          {/* Empty divs to create a gap */}
          <div className="relative w-full h-[300px] lg:h-[18vw] md:w-[50vw] mx-auto z-[-1]">
            {/* Empty div to create a gap */}
          </div>
          <div className="relative w-full h-[300px] lg:h-[18vw] md:w-[50vw] mx-auto z-[-1]">
            {/* Empty div to create a gap */}
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full items-center mt-8">
          <div className="flex xl:flex-wrap justify-center gap-2 sm:gap-4 my-6 lg:flex-row flex-col items-center">
            <span className="text-primary font-apotek-extended font-semi-bold text-2xl md:text-4xl lg:text-5xl">
              Trusted
            </span>
            <span className="font-bold">
              <LightningBolt className="h-5 w-5 sm:h-6 sm:w-6 md:h-12 md:w-12 stroke-primary fill-primary dark:stroke-white dark:fill-white" />
            </span>
            <span className="text-primary font-apotek-extended font-semi-bold text-2xl md:text-4xl lg:text-5xl">
              Dependable
            </span>
            <span className="font-bold">
              <LightningBolt className="h-5 w-5 sm:h-6 sm:w-6 md:h-12 md:w-12 stroke-primary fill-primary dark:stroke-white dark:fill-white" />
            </span>
            <span className="text-primary font-apotek-extended font-semi-bold text-2xl md:text-4xl lg:text-5xl">
              Everytime
            </span>
          </div>
        </div>
        <div className="container mx-auto px-4 relative text-center z-10 mb-24">
          <p className="sm:text-lg md:text-xl text-white dark:text-white text-center max-w-3xl mx-auto px-4 sm:px-0 font-noto antialiased font-semibold">
            When it comes to powering your adventures on the water, reliability isn&apos;t just a
            feature – it&apos;s a necessity. Professional anglers trust Stealth Batteries for our
            unmatched performance, advanced Lithium Iron Phosphate technology, and rigorous quality
            standards that ensure dependable power every time you hit the water.
          </p>
        </div>
      </div>
    </section>
  )
}
