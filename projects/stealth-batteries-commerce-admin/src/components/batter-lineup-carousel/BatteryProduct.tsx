'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ProductDisplayProps } from './types'

export function BatteryProduct({ item, isActive }: ProductDisplayProps) {
  if (!('voltage' in item) || !item.isBattery) return null

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-2 mt-5">
      {/* Voltage Display - Mobile Optimized */}
      <div
        className={`absolute top-0 ${
          isActive
            ? 'mt-8 sm:mt-12 md:mt-0 top-[10%] md:top-[18%] lg:top-[18%] left-1/2 -translate-x-1/2 text-center'
            : 'mt-4 top-[10%] md:top-[10%] lg:top-[10%] left-1/2 -translate-x-1/2 text-center'
        }`}
        style={{ zIndex: 3 }}
      >
        <h3
          className={`font-bold tracking-tight font-apotek-extended ${
            isActive
              ? 'text-3xl xs:text-4xl sm:text-5xl md:text-6xl'
              : 'text-xl xs:text-2xl sm:text-3xl md:text-5xl'
          }`}
        >
          {item.voltage.replace('V', '')}
          <span className="text-primary">V</span>
        </h3>
      </div>

      {/* Image Container - Mobile Optimized */}
      <Link href={item.link} className="w-[85%] sm:w-[75%] h-[70%] sm:h-[75%]">
        <div
          className={`relative w-full h-full rounded-full flex items-center justify-center ${
            isActive ? 'bg-[radial-gradient(circle,rgba(0,0,0,0.5)_0%,transparent_70%)]' : ''
          }`}
          style={{ zIndex: 2 }}
        >
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes={
              isActive
                ? '(max-width: 640px) 280px, (max-width: 768px) 320px, (max-width: 1024px) 400px, 500px'
                : '(max-width: 640px) 200px, (max-width: 768px) 240px, (max-width: 1024px) 280px, 320px'
            }
            className={`object-contain ${
              isActive
                ? 'scale-75 -translate-y-2 sm:-translate-y-1 md:translate-y-0'
                : 'scale-90 sm:scale-100'
            }`}
            priority={isActive}
            quality={75}
          />
        </div>
      </Link>

      {/* Product Info - Mobile Optimized */}
      <div
        className={`absolute bottom-0 ${
          isActive
            ? '-translate-y-1/2 sm:-translate-y-3/4 md:translate-y-0 bottom-[8%] md:bottom-[15%] lg:bottom-[12%] left-1/2 -translate-x-1/2 text-center px-2'
            : 'translate-y-2 sm:bottom-[3%] md:bottom-[5%] lg:bottom-[6%] left-1/2 -translate-x-1/2 text-center px-2'
        }`}
        style={{ zIndex: 3 }}
      >
        <h3
          className={`font-bold uppercase tracking-wide font-apotek-extended ${
            isActive
              ? 'text-lg xs:text-xl sm:text-2xl text-primary mb-0.5'
              : 'text-sm xs:text-base sm:text-lg mb-0.5'
          }`}
        >
          {item.name}
        </h3>
        <p
          className={`font-bold tracking-tight font-apotek-extended ${
            isActive
              ? 'text-2xl xs:text-3xl sm:text-4xl md:text-5xl'
              : 'text-lg xs:text-xl sm:text-2xl'
          }`}
        >
          {item.capacity.replace('AH', '')}
          <span className="text-primary font-apotek-extended">AH</span>
        </p>
      </div>
    </div>
  )
}
