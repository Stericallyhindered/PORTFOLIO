import type Stripe from 'stripe'
// Centralised service instances (handles build-time stubs & runtime keys)
import { stripe } from '@/lib/services-init'

// re-export the shared instance for convenience
export { stripe }

export interface CreatePaymentIntentParams {
  amount: number // in cents
  currency: string
  customerId?: string
  metadata?: Record<string, string>
  description?: string
}

export interface CreateCustomerParams {
  email: string
  name?: string
  metadata?: Record<string, string>
}

export interface CreateSubscriptionParams {
  customerId: string
  priceId: string
  metadata?: Record<string, string>
}

export interface CreateRefundParams {
  paymentIntentId?: string
  chargeId?: string
  amount?: number // in cents, partial refund if specified
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  metadata?: Record<string, string>
}

// Payment Intent operations
export async function createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency,
    customer: params.customerId,
    metadata: params.metadata,
    description: params.description,
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

export async function confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.confirm(paymentIntentId)
}

// Customer operations
export async function createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata,
  })
}

export async function retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
  return await stripe.customers.retrieve(customerId) as Stripe.Customer
}

export async function updateCustomer(customerId: string, params: Partial<CreateCustomerParams>): Promise<Stripe.Customer> {
  return await stripe.customers.update(customerId, {
    email: params.email,
    name: params.name,
    metadata: params.metadata,
  })
}

// Payment Method operations
export async function listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  })
  return paymentMethods.data
}

export async function attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  })
}

export async function detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.detach(paymentMethodId)
}

// Subscription operations
export async function createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    metadata: params.metadata,
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })
}

export async function retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

export async function updateSubscription(
  subscriptionId: string,
  params: {
    priceId?: string
    metadata?: Record<string, string>
    cancelAtPeriodEnd?: boolean
  }
): Promise<Stripe.Subscription> {
  const updateParams: Stripe.SubscriptionUpdateParams = {}
  
  if (params.priceId) {
    const subscription = await retrieveSubscription(subscriptionId)
    updateParams.items = [{
      id: subscription.items.data[0].id,
      price: params.priceId,
    }]
  }
  
  if (params.metadata) {
    updateParams.metadata = params.metadata
  }
  
  if (params.cancelAtPeriodEnd !== undefined) {
    updateParams.cancel_at_period_end = params.cancelAtPeriodEnd
  }
  
  return await stripe.subscriptions.update(subscriptionId, updateParams)
}

export async function cancelSubscription(
  subscriptionId: string,
  immediate: boolean = false
): Promise<Stripe.Subscription> {
  if (immediate) {
    return await stripe.subscriptions.cancel(subscriptionId)
  } else {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  }
}

// Refund operations
export async function createRefund(params: CreateRefundParams): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    reason: params.reason,
    metadata: params.metadata,
  }

  if (params.paymentIntentId) {
    refundParams.payment_intent = params.paymentIntentId
  } else if (params.chargeId) {
    refundParams.charge = params.chargeId
  } else {
    throw new Error('Either paymentIntentId or chargeId must be provided')
  }

  if (params.amount) {
    refundParams.amount = params.amount
  }

  return await stripe.refunds.create(refundParams)
}

export async function retrieveRefund(refundId: string): Promise<Stripe.Refund> {
  return await stripe.refunds.retrieve(refundId)
}

export async function listRefunds(params?: {
  paymentIntentId?: string
  chargeId?: string
  limit?: number
}): Promise<Stripe.Refund[]> {
  const listParams: Stripe.RefundListParams = {
    limit: params?.limit || 10,
  }

  if (params?.paymentIntentId) {
    listParams.payment_intent = params.paymentIntentId
  } else if (params?.chargeId) {
    listParams.charge = params.chargeId
  }

  const refunds = await stripe.refunds.list(listParams)
  return refunds.data
}

export async function cancelRefund(refundId: string): Promise<Stripe.Refund> {
  return await stripe.refunds.cancel(refundId)
}

// Price operations
export async function listPrices(params?: {
  active?: boolean
  limit?: number
}): Promise<Stripe.Price[]> {
  const listParams: Stripe.PriceListParams = {
    limit: params?.limit || 100,
  }
  
  if (params?.active !== undefined) {
    listParams.active = params.active
  }

  const prices = await stripe.prices.list(listParams)
  return prices.data
}

// Webhook verification
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  )
}
