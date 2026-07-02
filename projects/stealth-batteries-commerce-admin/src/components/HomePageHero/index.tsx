'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

export const HomePageHero: React.FC = () => {
  return (
    <section className="relative w-full bg-black h-[250px] pt-16 md:h-[450px] lg:h-[600px]">
      <div className="absolute inset-0 flex items-center justify-center mt-4">
        <Image
          src="/assets/PNG/stealth-hero-background-uncompressed.png"
          alt="Main Hero Background"
          width={2560}
          height={1440}
          className="object-contain object-top w-auto h-auto"
          priority
          loading="eager"
          quality={66}
          sizes="100vw"
        />
      </div>

      {/* Main content container */}
      <div className="relative z-10 mx-auto w-full h-full flex flex-col justify-center items-center">
        {/* Battery image */}
        <motion.div
          className="relative w-[400px] h-[220px] md:w-[600px] md:h-[320px] lg:w-[925px] lg:h-[500px]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <Image
            src="/assets/PNG/main-page-hero-135.png"
            alt="Kraken Deep Cycle Battery"
            width={925}
            height={500}
            className="object-contain"
            priority
            loading="eager"
            quality={85}
            sizes="(max-width: 475px) 280px, (max-width: 640px) 320px, (max-width: 768px) 400px, (max-width: 1024px) 600px, 925px"
          />
        </motion.div>
      </div>
      {/* Bottom Orange Lines */}
      <div className="flex-1 h-[48px] w-full absolute bottom-0 translate-y-full">
        <svg width="100%" height="100%" className="relative inset-0 z-1">
          <defs>
            <pattern
              id="diagonalLinesHeaderAngle"
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
                className="text-primary"
                strokeWidth="7"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalLinesHeaderAngle)" />
        </svg>
      </div>
    </section>
  )
}
