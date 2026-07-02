import type { CollectionBeforeChangeHook } from 'payload'
import { createStripe } from '../../../utilities/stripe'

const stripe = createStripe()

export const handleStripeConnect: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  // Only handle Stripe setup for new affiliates or when payment method changes to Stripe
  if (
    operation === 'create' ||
    (operation === 'update' &&
      data.payoutInfo?.paymentMethod === 'stripe' &&
      !data.payoutInfo?.stripeAccountId)
  ) {
    try {
      // Create a Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // You might want to make this configurable
        email: data.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: data.companyName ? 'company' : 'individual',
        business_profile: {
          name: data.companyName || data.name,
          url: process.env.NEXT_PUBLIC_SERVER_URL,
        },
      })

      // Generate an account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/affiliate/onboarding/refresh`,
        return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/affiliate/onboarding/complete`,
        type: 'account_onboarding',
      })

      // Update the affiliate data with Stripe information
      return {
        ...data,
        payoutInfo: {
          ...data.payoutInfo,
          stripeAccountId: account.id,
          stripeOnboardingComplete: false,
        },
        stripeConnectURL: accountLink.url,
      }
    } catch (error) {
      console.error('Error setting up Stripe Connect account:', error)
      throw new Error(
        'Failed to set up Stripe Connect account. Please try again or contact support.',
      )
    }
  }

  return data
}
