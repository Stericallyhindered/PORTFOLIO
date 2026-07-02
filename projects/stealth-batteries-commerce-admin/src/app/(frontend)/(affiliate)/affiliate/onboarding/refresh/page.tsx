import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/getPayload'
import { createStripe } from '@/utilities/stripe'
import { Payload } from 'payload'

const stripe = createStripe()

interface SessionUser {
  id: string
  collection: string
}

export default async function OnboardingRefreshPage() {
  const payload = await getPayloadClient()

  // Get the currently logged in affiliate
  const { doc: session } = await (payload as Payload).findGlobal({
    slug: 'session' as any, // TODO: Add session to GlobalSlug type
  })

  const user = session?.user as SessionUser | null

  if (!user || user.collection !== 'affiliates') {
    redirect('/affiliate/login')
  }

  try {
    // Get the affiliate's Stripe account ID
    const affiliate = await payload.findByID({
      collection: 'affiliates',
      id: user.id,
    })

    const stripeAccountId = affiliate.payoutInfo?.stripeAccountId
    if (!stripeAccountId) {
      throw new Error('No Stripe account found')
    }

    // Generate a new account link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/affiliate/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/affiliate/onboarding/complete`,
      type: 'account_onboarding',
    })

    // Update the affiliate with the new onboarding URL
    await payload.update({
      collection: 'affiliates',
      id: user.id,
      data: {
        stripeConnectURL: accountLink.url,
      },
    })

    // Redirect to the new onboarding URL
    redirect(accountLink.url)
  } catch (error) {
    console.error('Error refreshing Stripe onboarding:', error)
    redirect('/affiliate/dashboard?onboarding=error')
  }
}
