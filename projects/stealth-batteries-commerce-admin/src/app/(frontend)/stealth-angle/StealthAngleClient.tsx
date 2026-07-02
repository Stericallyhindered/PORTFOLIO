'use client'

import React, { useState } from 'react'
import StealthAngleEvent from '@/components/StealthAngleEvent'
import Link from 'next/link'
import { SecondaryFooter } from '@/components/secondary-footer'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface StealthAngleClientProps {
  initialEvents: {
    docs: any[]
    hasNextPage: boolean
    nextPage?: number | null
  }
}
const HeaderWithLines: React.FC<{
  title?: string
  color: string
  children?: React.ReactNode
  strokeWidth?: number
  subtitle?: string
}> = ({ title, color, children, strokeWidth = 5, subtitle }) => (
  <div className="w-screen relative mx-auto mb-12 pb-12 -ml-[50vw] left-1/2 right-1/2 z-10 flex flex-col items-center justify-center">
    <div className="flex items-center justify-center w-full">
      {/* Left Lines */}
      <div className="flex-1 h-[32px] xl:h-[42px] relative">
        <svg width="100%" height="100%" className="absolute inset-0" preserveAspectRatio="none">
          <defs>
            <pattern
              id={`diagonalLines${title}`}
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
                stroke={color}
                strokeWidth={strokeWidth}
                fill={color}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#diagonalLines${title})`} />
        </svg>
      </div>

      {/* Center Content */}
      {children ? (
        children
      ) : (
        <div className="text-center px-12 shrink-0">
          <h2
            className={`text-primary text-6xl xl:text-8xl font-apotek-extended font-black italic`}
          >
            {title}
          </h2>
        </div>
      )}

      {/* Right Lines */}
      <div className="flex-1 h-[32px] xl:h-[42px] relative ">
        <svg width="100%" height="100%" className="absolute inset-0" preserveAspectRatio="none">
          <defs>
            <pattern
              id={`diagonalLines${title}2`}
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
                stroke={color}
                strokeWidth={strokeWidth}
                fill={color}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#diagonalLines${title}2)`} />
        </svg>
      </div>
    </div>
    {subtitle && (
      <p className="text-primary text-lg xl:text-3xl font-apotek-extended font-black italic capitalize">
        {subtitle}
      </p>
    )}
  </div>
)

export default function StealthAngleClient({ initialEvents }: StealthAngleClientProps) {
  const [events, setEvents] = useState(initialEvents.docs)
  const [currentPage, setCurrentPage] = useState(2) // Start at 2 since we already have page 1
  const [hasMore, setHasMore] = useState(initialEvents.hasNextPage)
  const [isLoading, setIsLoading] = useState(false)

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/events?page=${currentPage}`)
      const result = await response.json()

      setEvents((prev) => [...prev, ...result.docs])
      setHasMore(result.hasNextPage)
      setCurrentPage((prev) => prev + 1)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-12 bg-white dark:bg-black text-gray-900 dark:text-white">
      <Image
        src="/assets/SVG/stealth-hero-kraken.svg"
        alt="Stealth Hero Kraken"
        width={1000}
        height={1000}
        className="absolute top-0 left-0 w-full h-full object-cover object-top z-0 bg-gradient-to-b from-black via-black to-[#1A1A1A]"
      />
      <div className="relative z-10">
        <HeaderWithLines color="#3C4B5A" strokeWidth={8} subtitle="Expect the Best, Get the Best!">
          <div className="text-center px-12 shrink-0 z-10">
            <h1
              className={`text-6xl xl:text-[125px] max-w-screen flex flex-col md:flex-row gap-2 items-center justify-center font-apotek-extended font-black italic uppercase text-primary`}
            >
              <span>
                The <span className="text-white">Stealth Angle</span>
              </span>
            </h1>
          </div>
        </HeaderWithLines>
        <div className="container my-8">
          <h2 className="text-foreground text-center uppercase text-lg md:text-2xl font-bold mb-4 font-apotek-extended">
            View the latest <span className="text-primary"> events</span> featuring professional
            <span className="text-primary"> anglers</span>
          </h2>
        </div>

        <div className="mx-4 xl:mx-32 px-4 xl:px-32 pt-24">
          {events.length > 0 ? (
            <>
              <div className="grid gap-8">
                {events.map((event) => (
                  <StealthAngleEvent key={event.id} event={event} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-12 mb-8">
                  <Button
                    onClick={loadEvents}
                    disabled={isLoading}
                    className="bg-[#F04923] hover:bg-[#d13d1d] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {isLoading ? 'Loading...' : 'Load More Events'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-300">
                No upcoming events at this time. Check back soon!
              </p>
              <Link
                href="/stealth-angle/past-events"
                className="text-primary hover:text-orange-600 font-semibold mt-4 inline-block"
              >
                View Past Events
              </Link>
            </div>
          )}
          <div className="flex items-center justify-between mt-12">
            <Link
              href="/stealth-angle/past-events"
              className="text-primary hover:text-orange-600 font-semibold"
            >
              View Past Events
            </Link>
          </div>
        </div>
        <SecondaryFooter />
      </div>
    </div>
  )
}
