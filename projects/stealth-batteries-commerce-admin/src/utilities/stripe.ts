import Stripe from 'stripe'

// This function creates a Stripe instance with the newer API version
// We use a type assertion because we know this works at runtime
// even though the type system doesn't recognize the newer version
export const createStripe = () => {
  const config = {
    apiVersion: '2024-04-10' as '2022-08-01', // Type assertion to satisfy the type system
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', config)
} 