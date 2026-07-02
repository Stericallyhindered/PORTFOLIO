import type { CollectionConfig, PayloadRequest, Where } from 'payload'
import { isAdmin, isAdminFieldLevel } from '@/access/is-admin'
import { generateAffiliateCode } from './hooks/generateAffiliateCode'
import { handleStripeConnect } from './hooks/handleStripeConnect'

type AffiliateUser = {
  id?: string | number
  collection?: string
  canAccessAdmin?: boolean
  verified?: boolean
}

export const Affiliates: CollectionConfig = {
  slug: 'affiliates',
  auth: {
    useAPIKey: false,
    verify: {
      generateEmailHTML: ({ token }) => {
        return `
          <p>Please verify your email by clicking the link below:</p>
          <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}">Verify Email</a>
        `
      },
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'affiliateCode', 'verified'],
    description: 'Affiliate partners who can earn commission through referrals',
  },
  access: {
    read: ({ req }: { req: PayloadRequest }): boolean | Where => {
      // Admins can read all affiliates
      if (isAdmin({ req })) return true

      const typedUser = req.user as unknown as AffiliateUser

      // For non-authenticated requests (like during login), only allow reading verified affiliates
      if (!req.user) {
        return {
          verified: {
            equals: true,
          },
        }
      }

      // Verified affiliates can only read themselves
      if (typedUser?.collection === 'affiliates' && typedUser?.verified) {
        return {
          id: {
            equals: typedUser.id,
          },
        }
      }

      // All other cases are denied
      return false
    },
    create: (): boolean => true, // Allow public registration
    update: ({ req }: { req: PayloadRequest }): boolean | Where => {
      // Admins can update all affiliates
      if (isAdmin({ req })) return true

      const typedUser = req.user as unknown as AffiliateUser
      if (typedUser?.collection === 'affiliates' && typedUser?.verified) {
        return {
          id: {
            equals: typedUser.id,
          },
        }
      }
      return false
    },
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [generateAffiliateCode, handleStripeConnect],
    beforeLogin: [
      async ({ user }) => {
        if (!user.verified) {
          const error = new Error(
            'Your affiliate account is pending approval. Please contact support.',
          )
          error.stack = ''
          ;(error as any).status = 401
          throw error
        }
        return user
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          console.log('New affiliate registration:', doc.email)
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the affiliate',
      },
    },
    {
      name: 'companyName',
      type: 'text',
      admin: {
        description: 'Optional company or business name',
      },
    },
    {
      name: 'phoneNumber',
      type: 'text',
      required: true,
      admin: {
        description: 'Contact phone number',
      },
    },
    {
      name: 'affiliateCode',
      type: 'text',
      unique: true,
      admin: {
        description: 'Unique affiliate code (automatically generated)',
        readOnly: true,
      },
    },
    {
      name: 'affiliateCommission',
      type: 'number',
      required: true,
      defaultValue: 10,
      min: 0,
      max: 100,
      admin: {
        description: 'Percentage commission the affiliate receives (default 10%)',
      },
      access: {
        update: isAdminFieldLevel,
      },
    },
    {
      name: 'customerDiscount',
      type: 'number',
      required: true,
      defaultValue: 15,
      min: 0,
      max: 100,
      admin: {
        description:
          'Percentage discount customers receive using this affiliate code (default 15%)',
      },
      access: {
        update: isAdminFieldLevel,
      },
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      access: {
        read: () => true,
        update: isAdminFieldLevel,
      },
      admin: {
        description: 'Has this affiliate been verified by an admin?',
        position: 'sidebar',
      },
    },
    {
      name: 'payoutInfo',
      type: 'group',
      admin: {
        description: 'Payment information for affiliate commissions',
      },
      fields: [
        {
          name: 'paymentMethod',
          type: 'select',
          required: true,
          defaultValue: 'stripe',
          options: [
            {
              label: 'Stripe',
              value: 'stripe',
            },
            {
              label: 'PayPal',
              value: 'paypal',
            },
            {
              label: 'Bank Transfer',
              value: 'bank',
            },
          ],
          admin: {
            description: 'Preferred payment method for commissions',
          },
        },
        {
          name: 'stripeAccountId',
          type: 'text',
          admin: {
            description: 'Stripe Connect account ID',
            readOnly: true,
            condition: (data, siblingData) => siblingData?.paymentMethod === 'stripe',
          },
        },
        {
          name: 'stripeOnboardingComplete',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Whether Stripe onboarding has been completed',
            readOnly: true,
            condition: (data, siblingData) => siblingData?.paymentMethod === 'stripe',
          },
        },
        {
          name: 'paypalEmail',
          type: 'email',
          admin: {
            description: 'PayPal email for commission payments',
            condition: (data, siblingData) => siblingData?.paymentMethod === 'paypal',
          },
        },
        {
          name: 'bankName',
          type: 'text',
          admin: {
            description: 'Bank name for direct deposit',
            condition: (data, siblingData) => siblingData?.paymentMethod === 'bank',
          },
        },
        {
          name: 'accountNumber',
          type: 'text',
          admin: {
            description: 'Bank account number',
            condition: (data, siblingData) => siblingData?.paymentMethod === 'bank',
          },
        },
        {
          name: 'routingNumber',
          type: 'text',
          admin: {
            description: 'Bank routing number',
            condition: (data, siblingData) => siblingData?.paymentMethod === 'bank',
          },
        },
      ],
    },
    {
      name: 'stripeConnectURL',
      type: 'text',
      admin: {
        description: 'Temporary Stripe Connect onboarding URL',
        readOnly: true,
        position: 'sidebar',
        condition: (data) =>
          data.payoutInfo?.paymentMethod === 'stripe' && !data.payoutInfo?.stripeOnboardingComplete,
      },
    },
    {
      name: 'totalEarnings',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Total earnings from affiliate commissions',
        readOnly: true,
      },
    },
    {
      name: 'totalOrders',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Total number of orders through this affiliate',
        readOnly: true,
      },
    },
  ],
}
