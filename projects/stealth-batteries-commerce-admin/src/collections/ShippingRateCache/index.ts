import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/is-admin'

export const ShippingRateCache: CollectionConfig = {
  slug: 'shipping-rate-cache',
  admin: {
    hidden: true, // Hide from admin menu completely
    useAsTitle: 'cacheKey',
    description: 'Cached shipping rates to minimize API calls',
    defaultColumns: ['cacheKey', 'carrier', 'createdAt', 'expiresAt'],
  },
  access: {
    read: () => true, // Needs to be readable by the store
    create: () => true, // Created by the rate calculation service
    update: () => true,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'cacheKey',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique key for this rate calculation',
      },
    },
    {
      name: 'carrier',
      type: 'select',
      required: true,
      options: [
        { label: 'UPS', value: 'ups' },
        { label: 'FedEx', value: 'fedex' },
      ],
    },
    {
      name: 'origin',
      type: 'group',
      fields: [
        {
          name: 'postalCode',
          type: 'text',
          required: true,
        },
        {
          name: 'stateCode',
          type: 'text',
          required: true,
        },
        {
          name: 'countryCode',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'destination',
      type: 'group',
      fields: [
        {
          name: 'postalCode',
          type: 'text',
          required: true,
        },
        {
          name: 'stateCode',
          type: 'text',
          required: true,
        },
        {
          name: 'countryCode',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'packageDetails',
      type: 'group',
      fields: [
        {
          name: 'weight',
          type: 'number',
          required: true,
        },
        {
          name: 'length',
          type: 'number',
          required: true,
        },
        {
          name: 'width',
          type: 'number',
          required: true,
        },
        {
          name: 'height',
          type: 'number',
          required: true,
        },
        {
          name: 'isLTL',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'freightClass',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.isLTL,
          },
        },
      ],
    },
    {
      name: 'rates',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'service',
          type: 'text',
          required: true,
        },
        {
          name: 'serviceCode',
          type: 'text',
          required: true,
        },
        {
          name: 'rate',
          type: 'number',
          required: true,
        },
        {
          name: 'transitDays',
          type: 'number',
        },
        {
          name: 'guaranteedDelivery',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'createdAt',
      type: 'date',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      admin: {
        description: 'When this cached rate expires',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Set creation and expiration dates
        const now = new Date()
        if (!data.createdAt) {
          data.createdAt = now
        }
        if (!data.expiresAt) {
          // Cache rates for 24 hours by default
          data.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        }
        return data
      },
    ],
  },
}
