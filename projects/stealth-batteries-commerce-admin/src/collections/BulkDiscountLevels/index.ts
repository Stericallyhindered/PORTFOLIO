import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/is-admin'

export const BulkDiscountLevels: CollectionConfig = {
  slug: 'bulk-discount-levels',
  admin: {
    useAsTitle: 'name',
    description: 'Manage bulk pricing discount levels by cart subtotal',
    defaultColumns: ['name', 'threshold', 'discountPercent', 'active'],
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
        description:
          'Label for this discount level (e.g. $20k+ Extra 5%) - This will be displayed in the cart and checkout and also used to identify this bulk discount',
      },
    },
    {
      name: 'threshold',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Cart subtotal threshold ($) to trigger this discount',
      },
    },
    {
      name: 'discountPercent',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      admin: {
        description: 'Percentage discount applied when threshold is met (0-100)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional description for this discount level',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this discount level is currently active',
        position: 'sidebar',
      },
    },
  ],
}
