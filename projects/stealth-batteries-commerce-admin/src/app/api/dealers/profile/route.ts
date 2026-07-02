import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/getPayload'
import { cookies } from 'next/headers'

export async function PATCH(req: Request) {
  try {
    const payload = await getPayloadClient()
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current dealer using Payload's built-in authentication endpoint
    const dealerResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/me`, {
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    })

    if (!dealerResponse.ok) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 })
    }

    const dealerData = await dealerResponse.json()
    const user = dealerData.user

    if (!user) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 })
    }

    const body = await req.json()
    const { companyName, contactName, phoneNumber, email, address } = body

    // Update the dealer with all the profile data including address
    const updatedDealer = await payload.update({
      collection: 'dealers',
      id: user.id,
      data: {
        companyName,
        contactName,
        phoneNumber,
        email,
        address: {
          line1: address.line1,
          line2: address.line2 || '',
          city: address.city,
          state: address.state,
          zip: address.zip,
        },
      },
    })

    return NextResponse.json(updatedDealer)
  } catch (error) {
    console.error('Error updating dealer profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
