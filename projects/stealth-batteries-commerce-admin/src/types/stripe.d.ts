import Stripe from 'stripe'

declare module 'stripe' {
  namespace Stripe {
    interface StripeConfig {
      apiVersion: '2022-08-01' | '2024-04-10'
    }
  }
} 