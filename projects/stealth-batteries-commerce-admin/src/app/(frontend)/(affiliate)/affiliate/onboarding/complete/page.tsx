import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/getPayload'
import { createStripe } from '@/utilities/stripe'
import { Payload } from 'payload'

const stripe = createStripe()

interface SessionUser {
  id: string
  collection: string
}

export default async function OnboardingCompletePage() {
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

    // Retrieve the account to check its status
    const account = await stripe.accounts.retrieve(stripeAccountId)

    // Check if the account has completed onboarding
    const isComplete =
      account.details_submitted &&
      account.payouts_enabled &&
      account.capabilities?.transfers === 'active'

    if (isComplete) {
      // Update the affiliate record
      await payload.update({
        collection: 'affiliates',
        id: user.id,
        data: {
          payoutInfo: {
            ...affiliate.payoutInfo,
            stripeOnboardingComplete: true,
          },
          stripeConnectURL: null, // Clear the onboarding URL
        },
      })

      // Redirect to the dashboard with success message
      redirect('/affiliate/dashboard?onboarding=success')
    } else {
      // Redirect to the dashboard with incomplete message
      redirect('/affiliate/dashboard?onboarding=incomplete')
    }
  } catch (error) {
    console.error('Error completing Stripe onboarding:', error)
    redirect('/affiliate/dashboard?onboarding=error')
  }
}
