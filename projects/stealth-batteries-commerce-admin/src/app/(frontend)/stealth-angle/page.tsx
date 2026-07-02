import type { Metadata } from 'next/types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import StealthAngleClient from './StealthAngleClient'

export const dynamic = 'force-static'
export const revalidate = 600

async function getInitialEvents() {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()

  return payload.find({
    collection: 'stealth-events',
    depth: 1,
    limit: 12,
    page: 1,
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
              // Event hasn't ended yet (or has no end date)
              eventEndDate: {
                greater_than_equal: now,
              },
            },
            {
              // Event has no end date but starts in the future
              and: [
                {
                  eventEndDate: {
                    equals: null,
                  },
                },
                {
                  eventStartDate: {
                    greater_than_equal: now,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    sort: 'eventStartDate', // Soonest first
  })
}

export default async function StealthAnglePage() {
  const initialEvents = await getInitialEvents()

  return <StealthAngleClient initialEvents={initialEvents} />
}

export const metadata: Metadata = {
  title: 'Upcoming Events | The Stealth Angle',
  description:
    'Discover upcoming fishing events and tournaments where you can meet the Stealth Batteries team.',
  alternates: {
    canonical: 'https://stealthbatteries.com/stealth-angle',
  },
}
