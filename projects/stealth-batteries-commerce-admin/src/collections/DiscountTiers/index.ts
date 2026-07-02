import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/is-admin'

export const DiscountTiers: CollectionConfig = {
  slug: 'discount-tiers',
  admin: {
    useAsTitle: 'name',
    description: 'Manage dealer discount tiers',
    defaultColumns: [
      'name',
      'discountPercentage',
      'volumeDiscountThreshold',
      'volumeDiscountPercentage',
      'active',
    ],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the discount tier (e.g. Standard, Premium, Elite)',
      },
    },
    {
      name: 'discountPercentage',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Base percentage discount for this tier (0-100, optional)',
      },
    },
    {
      name: 'volumeDiscountThreshold',
      type: 'number',
      min: 0,
      admin: {
        description: 'Order subtotal threshold for additional volume discount ($, optional)',
      },
    },
    {
      name: 'volumeDiscountPercentage',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description:
          'Additional percentage discount when order exceeds threshold (0-100, optional)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Description of this discount tier and its benefits',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this discount tier is currently active',
        position: 'sidebar',
      },
    },
    {
      name: 'customShipping',
      type: 'group',
      label: 'Custom Shipping',
      admin: {
        description: 'Custom shipping options for this discount tier',
      },
      fields: [
        {
          name: 'hasFreeShipping',
          type: 'checkbox',
          label: 'Allow Free Shipping for this Tier',
          admin: {
            description: 'If checked, all dealers in this tier get free shipping.',
          },
        },
        {
          name: 'customPrice',
          type: 'number',
          label: 'Custom Shipping Price for this Tier',
          admin: {
            description:
              'If set, all dealers in this tier will be charged this shipping price instead of UPS rates.',
          },
        },
      ],
    },
  ],
}
