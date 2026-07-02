import type { Metadata } from 'next/types'
import React from 'react'
import Image from 'next/image'
import { SecondaryFooter } from '@/components/secondary-footer'
import LightningBolt from '@/components/icons/LightningBolt'
import AnglerSection from './components/AnglerSection'
import { getAllAnglers } from './utils/loadAnglers'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const anglers = getAllAnglers()
  const sectionTitles = ['Trusted', 'Dependable', 'Everytime']

  return (
    <div className="min-h-screen pt-24 pb-24">
      {/* Background pattern/lines */}
      {/* Main content */}
      <div className="relative">
        {/* Header section */}
        <div className="relative bg-gray-900 dark:bg-black z-10">
          <div className="absolute inset-0 w-full h-full z-0">
            <Image
              src="/assets/PNG/stealth-fishing-merge.png"
              alt="Stealth Angler Testimonials Background"
              width={1500}
              height={1500}
              className="object-cover w-full h-full md:block hidden"
            />
            <Image
              src="/assets/PNG/stealth-fishing-merge.png"
              alt="Stealth Angler Testimonials Background"
              width={750}
              height={750}
              className="object-cover w-full h-full md:hidden"
            />
            <div className="absolute inset-0 w-full h-full bg-black/70 md:hidden" />
          </div>

          <div className="w-screen relative mx-auto mb-12 -ml-[50vw] left-1/2 right-1/2 z-10 pt-16 pb-12">
            <div className="flex items-center justify-center w-full">
              {/* Left Lines */}
              <div className="flex-1 h-[32px] xl:h-[42px] relative self-center">
                <svg
                  width="100%"
                  height="100%"
                  className="absolute inset-0"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <pattern
                      id={`diagonalLinesHeaderLeft`}
                      width="13"
                      height="13"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(15)"
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="13"
                        stroke={'#3B4B5A'}
                        strokeWidth="5"
                        fill={'#3B4B5A'}
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#diagonalLinesHeaderLeft)`} />
                </svg>
              </div>

              {/* Center Content */}
              <div className="text-center px-12 shrink-0">
                <h1 className="text-white text-6xl xl:text-[125px] flex flex-col md:flex-row gap-2 items-center justify-center font-apotek-extended font-black italic uppercase">
                  <span>
                    Anglers <span className="text-primary ">Corner</span>
                  </span>
                </h1>
              </div>

              {/* Right Lines */}
              <div className="flex-1 h-[32px] xl:h-[42px] relative self-center">
                <svg
                  width="100%"
                  height="100%"
                  className="absolute inset-0"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <pattern
                      id={`diagonalLinesHeaderRight`}
                      width="13"
                      height="13"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(15)"
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="13"
                        stroke={'#3B4B5A'}
                        strokeWidth="5"
                        fill={'#3B4B5A'}
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#diagonalLinesHeaderRight)`} />
                </svg>
              </div>
            </div>
            <div className="relative container mx-auto px-4 pb-12 z-10">
              <p className="text-primary text-center text-lg md:text-3xl font-apotek-extended italic">
                Why The Pros Choose Stealth Batteries!
              </p>
            </div>
          </div>
          {/* Hero image section */}
          <div className="relative md:h-[500px] w-full mb-16"></div>

          <div className="relative flex flex-col">
            {/* Three pillars section */}
            <div className="relative container mx-auto px-4 pt-12 z-10">
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 text-2xl md:text-4xl xl:text-5xl font-apotek-extended font-bold italic mb-16">
                <span className="text-primary">Trusted</span>
                <LightningBolt className="h-8 w-8 xl:h-12 xl:w-12 stroke-gray-900 dark:stroke-white fill-gray-900 dark:fill-white" />
                <span className="text-primary">Dependable</span>
                <LightningBolt className="h-8 w-8 xl:h-12 xl:w-12 stroke-gray-900 dark:stroke-white fill-gray-900 dark:fill-white" />
                <span className="text-primary">Everytime</span>
              </div>
            </div>
            {/* Content section */}
            <div className="relative container flex justify-center mx-auto px-4 pb-16 z-10">
              <div className="max-w-4xl">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8 text-center">
                  When it comes to powering your adventures on the water, reliability isn&apos;t
                  just a feature, it&apos;s a necessity. Stealth Batteries has earned the trust of
                  professional anglers and recreational enthusiasts alike by delivering unmatched.
                  Our advanced Lithium Iron Phosphate technology, coupled with rigorous quality
                  control and innovative design, ensures that your time on the water is spent
                  focusing on the catch, not worrying about your power source. That&apos;s the
                  Stealth advantage, trusted performance, unwavering dependability, every single
                  time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Pro Angler Testimonials */}
      <div className="relative bg-gray-100/50 w-full py-12">
        <div className="absolute inset-0 w-full h-full z-0 flex flex-col items-center justify-center">
          <Image
            src="/assets/SVG/stealth-hero-kraken.svg"
            alt="Stealth Kraken Background"
            fill
            className="object-cover object-top scale-105 opacity-95"
            priority
          />
          <div className="absolute inset-0 bg-white/85" />
        </div>
        <div className="relative mx-auto px-4 md:px-12 xl:px-32">
          {/* Battery Image */}
          <Image
            src="/assets/PNG/hero-battery-kraken-135-12v-compressed.png"
            alt="Battery"
            width={600}
            height={600}
            className="object-contain absolute top-0 left-1/2 z-[200] h-fit -translate-x-[45%] -translate-y-4/5 lg:translate-x-1/5 lg:-translate-y-[40%] w-[250px]  md:w-[275px] lg:w-[400px] xl:w-[600px]"
          />
          {/* Angler Sections */}
          {anglers.map((angler, index) => (
            <AnglerSection
              key={index}
              angler={angler}
              title={sectionTitles[index % sectionTitles.length]}
            />
          ))}
        </div>
        {/* Bottom Lines */}
        <div className="flex-1 h-[36px] w-full absolute bottom-0">
          <svg width="100%" height="100%" className="relative inset-0 z-1">
            <defs>
              <pattern
                id="diagonalLinesHeaderAngle"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(15)"
              >
                <line x1="0" y1="0" x2="0" y2="10" stroke="#42505E" strokeWidth="4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonalLinesHeaderAngle)" />
          </svg>
        </div>
      </div>

      <div className="relative bg-black z-10">
        <SecondaryFooter />
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Anglers Corner - Stealth Batteries',
    description: "Follow Stealth's pro anglers wherever they hit the big one!",
    alternates: {
      canonical: `${getServerSideURL()}/anglers-corner`,
    },
  }
}
