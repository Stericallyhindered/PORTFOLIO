import type { Metadata } from 'next/types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import LightningBolt from '@/components/icons/LightningBolt'
import FishingPromoBanner from '@/components/StealthAngleEvent'
import Link from 'next/link'
import { SecondaryFooter } from '@/components/secondary-footer'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function PastEvents() {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()

  const events = await payload.find({
    collection: 'stealth-events',
    depth: 1,
    limit: 12,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          or: [
            {
              // Event has ended
              eventEndDate: {
                less_than: now,
              },
            },
            {
              // Event has no end date but start date is in the past
              and: [
                {
                  eventEndDate: {
                    equals: null,
                  },
                },
                {
                  eventStartDate: {
                    less_than: now,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    sort: '-eventStartDate', // Most recent first
  })

  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Background pattern/lines */}
      {/* Main content */}
      <div className="flex flex-col items-center justify-between mt-12 container text-center">
        <div className="flex items-center gap-4">
          <LightningBolt className="w-8 h-8 text-primary scale-x-[1]" />
          <h1 className="text-3xl md:text-5xl font-bold">Past Stealth Angle Events</h1>
          <LightningBolt className="w-8 h-8 text-primary scale-x-[-1]" />
        </div>
        <Link href="/stealth-angle" className="text-primary hover:text-orange-600 font-semibold">
          View Upcoming Events
        </Link>
      </div>

      <div className="mx-4 xl:mx-32 px-4 xl:px-32 pt-24">
        {events.docs.length > 0 ? (
          <div className="grid gap-8">
            {events.docs.map((event) => (
              <FishingPromoBanner key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No past events to display.</p>
            <Link
              href="/stealth-angle"
              className="text-primary hover:text-orange-600 font-semibold mt-4 inline-block"
            >
              View Upcoming Events
            </Link>
          </div>
        )}
      </div>
      <SecondaryFooter />
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Past Events | The Stealth Angle',
  description:
    'Browse past fishing events and tournaments where the Stealth Batteries team made an appearance.',
  alternates: {
    canonical: 'https://stealthbatteries.com/stealth-angle/past-events',
  },
}
