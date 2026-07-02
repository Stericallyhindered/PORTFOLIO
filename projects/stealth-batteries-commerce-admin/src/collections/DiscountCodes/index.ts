import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/is-admin'

export const DiscountCodes: CollectionConfig = {
  slug: 'discount-codes',
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'email', 'discountType', 'totalUses', 'maxUses', 'active'],
    description: 'Manage store discount codes',
  },
  access: {
    read: () => true, // Needs to be readable by the store to validate codes
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The discount code (case-sensitive)',
      },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Email address this discount code is restricted to (optional)',
      },
    },
    {
      name: 'discountType',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Percentage',
          value: 'percentage',
        },
        {
          label: 'Fixed Amount',
          value: 'fixed',
        },
      ],
      admin: {
        description: 'Type of discount to apply',
      },
    },
    {
      name: 'discountAmount',
      type: 'number',
      min: 0,
      admin: {
        description: 'Amount of discount (percentage or fixed dollar amount, optional)',
      },
    },
    {
      name: 'maxUses',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Maximum number of times this code can be used',
      },
    },
    {
      name: 'totalUses',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Number of times this code has been used in completed orders',
        readOnly: true,
      },
    },
    {
      name: 'pendingUses',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Number of times this code is currently in active carts (editable)',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this discount code is currently active',
        position: 'sidebar',
      },
    },
    {
      name: 'validFrom',
      type: 'date',
      admin: {
        description: 'When this discount code becomes valid (optional)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'validUntil',
      type: 'date',
      admin: {
        description: 'When this discount code expires (optional)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'customShipping',
      type: 'group',
      label: 'Custom Shipping',
      admin: {
        description: 'Custom shipping options for this discount code',
      },
      fields: [
        {
          name: 'hasFreeShipping',
          type: 'checkbox',
          label: 'Allow Free Shipping with this Code',
          admin: {
            description: 'If checked, this code grants free shipping.',
          },
        },
        {
          name: 'customPrice',
          type: 'number',
          label: 'Custom Shipping Price with this Code',
          admin: {
            description: 'If set, this code grants this shipping price instead of UPS rates.',
          },
        },
      ],
    },
    {
      name: 'applicableProducts',
      label: 'Applicable Products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      required: false,
      admin: {
        description:
          'If set, this discount code only applies to these products. Otherwise, it applies to the entire cart subtotal.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Ensure discount amount is valid based on type
        if (data.discountType === 'percentage' && data.discountAmount > 100) {
          throw new Error('Percentage discount cannot exceed 100%')
        }

        // Ensure total uses + pending uses doesn't exceed max uses
        if ((data.totalUses || 0) + (data.pendingUses || 0) > data.maxUses) {
          throw new Error('Combined total and pending uses cannot exceed maximum uses')
        }

        return data
      },
    ],
  },
}
