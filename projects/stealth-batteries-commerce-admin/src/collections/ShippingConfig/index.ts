import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/is-admin'

export const ShippingConfig: CollectionConfig = {
  slug: 'shipping-config',
  admin: {
    hidden: true, // Hide from admin menu completely
    useAsTitle: 'name',
    description: 'Configure shipping rules and costs',
    defaultColumns: ['name', 'isActive', 'freeShippingThreshold', 'flatRateAmount'],
  },
  access: {
    read: () => true, // Needs to be readable by the store to calculate shipping
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
        description: 'Name of this shipping configuration (e.g. "Standard Shipping Rules")',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Only one configuration can be active at a time',
        position: 'sidebar',
      },
    },
    {
      name: 'freeShippingThreshold',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Order amount at which shipping becomes free (0 for never free)',
      },
    },
    {
      name: 'flatRateAmount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Flat rate shipping cost for orders below the free shipping threshold',
      },
    },
    {
      name: 'excludedStates',
      type: 'array',
      admin: {
        description: 'States where this shipping configuration does not apply',
      },
      fields: [
        {
          name: 'state',
          type: 'select',
          required: true,
          options: [
            { label: 'Alabama', value: 'AL' },
            { label: 'Alaska', value: 'AK' },
            { label: 'Arizona', value: 'AZ' },
            { label: 'Arkansas', value: 'AR' },
            { label: 'California', value: 'CA' },
            { label: 'Colorado', value: 'CO' },
            { label: 'Connecticut', value: 'CT' },
            { label: 'Delaware', value: 'DE' },
            { label: 'Florida', value: 'FL' },
            { label: 'Georgia', value: 'GA' },
            { label: 'Hawaii', value: 'HI' },
            { label: 'Idaho', value: 'ID' },
            { label: 'Illinois', value: 'IL' },
            { label: 'Indiana', value: 'IN' },
            { label: 'Iowa', value: 'IA' },
            { label: 'Kansas', value: 'KS' },
            { label: 'Kentucky', value: 'KY' },
            { label: 'Louisiana', value: 'LA' },
            { label: 'Maine', value: 'ME' },
            { label: 'Maryland', value: 'MD' },
            { label: 'Massachusetts', value: 'MA' },
            { label: 'Michigan', value: 'MI' },
            { label: 'Minnesota', value: 'MN' },
            { label: 'Mississippi', value: 'MS' },
            { label: 'Missouri', value: 'MO' },
            { label: 'Montana', value: 'MT' },
            { label: 'Nebraska', value: 'NE' },
            { label: 'Nevada', value: 'NV' },
            { label: 'New Hampshire', value: 'NH' },
            { label: 'New Jersey', value: 'NJ' },
            { label: 'New Mexico', value: 'NM' },
            { label: 'New York', value: 'NY' },
            { label: 'North Carolina', value: 'NC' },
            { label: 'North Dakota', value: 'ND' },
            { label: 'Ohio', value: 'OH' },
            { label: 'Oklahoma', value: 'OK' },
            { label: 'Oregon', value: 'OR' },
            { label: 'Pennsylvania', value: 'PA' },
            { label: 'Rhode Island', value: 'RI' },
            { label: 'South Carolina', value: 'SC' },
            { label: 'South Dakota', value: 'SD' },
            { label: 'Tennessee', value: 'TN' },
            { label: 'Texas', value: 'TX' },
            { label: 'Utah', value: 'UT' },
            { label: 'Vermont', value: 'VT' },
            { label: 'Virginia', value: 'VA' },
            { label: 'Washington', value: 'WA' },
            { label: 'West Virginia', value: 'WV' },
            { label: 'Wisconsin', value: 'WI' },
            { label: 'Wyoming', value: 'WY' },
          ],
        },
        {
          name: 'reason',
          type: 'text',
          admin: {
            description: 'Optional reason for excluding this state',
          },
        },
      ],
    },
    {
      name: 'additionalNotes',
      type: 'textarea',
      admin: {
        description: 'Any additional notes or special conditions for this shipping configuration',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // If this config is being set to active, deactivate all others
        if (data.isActive) {
          await req.payload.update({
            collection: 'shipping-config',
            where: {
              id: {
                not_equals: data.id || 'new', // 'new' for create operations
              },
            },
            data: {
              isActive: false,
            },
          })
        }
        return data
      },
    ],
  },
}
