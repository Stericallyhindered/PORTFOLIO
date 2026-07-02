import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()

    const events = await payload.find({
      collection: 'stealth-events',
      depth: 1,
      limit,
      page,
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

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
