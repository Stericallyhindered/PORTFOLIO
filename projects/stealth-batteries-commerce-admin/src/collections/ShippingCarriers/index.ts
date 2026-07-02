import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/is-admin'
import { encrypt, decrypt } from '@/lib/encryption'

export const ShippingCarriers: CollectionConfig = {
  slug: 'shipping-carriers',
  admin: {
    hidden: true, // Hide from admin menu completely
    useAsTitle: 'name',
    description: 'Configure shipping carrier integrations (UPS, FedEx, etc.)',
    defaultColumns: ['name', 'carrier', 'isActive', 'environment'],
  },
  access: {
    // Allow reading carrier configs for shipping calculations
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
        description: 'Name of this carrier configuration (e.g. "UPS Production")',
      },
    },
    {
      name: 'carrier',
      type: 'select',
      required: true,
      options: [
        {
          label: 'UPS',
          value: 'ups',
        },
        {
          label: 'FedEx',
          value: 'fedex',
        },
      ],
      admin: {
        description: 'Select the shipping carrier',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Only one configuration per carrier can be active at a time',
        position: 'sidebar',
      },
    },
    {
      name: 'environment',
      type: 'select',
      required: true,
      defaultValue: 'test',
      options: [
        {
          label: 'Test/Sandbox',
          value: 'test',
        },
        {
          label: 'Production',
          value: 'production',
        },
      ],
      admin: {
        description: 'API environment',
        position: 'sidebar',
      },
    },
    // UPS Configuration
    {
      name: 'upsConfig',
      type: 'group',
      admin: {
        description: 'UPS API Configuration',
        condition: (data) => data.carrier === 'ups',
      },
      fields: [
        {
          name: 'credentials',
          type: 'group',
          fields: [
            {
              name: 'accessKey',
              type: 'text',
              required: true,
              admin: {
                description: 'UPS API Access Key',
              },
              hooks: {
                beforeChange: [
                  async ({ value }) => {
                    if (!value) return value
                    return await encrypt(value)
                  },
                ],
                afterRead: [
                  async ({ value }) => {
                    if (!value) return value
                    return await decrypt(value)
                  },
                ],
              },
            },
            {
              name: 'userId',
              type: 'text',
              required: true,
              admin: {
                description: 'UPS User ID',
              },
              hooks: {
                beforeChange: [
                  async ({ value }) => {
                    if (!value) return value
                    return await encrypt(value)
                  },
                ],
                afterRead: [
                  async ({ value }) => {
                    if (!value) return value
                    return await decrypt(value)
                  },
                ],
              },
            },
            {
              name: 'password',
              type: 'text',
              required: true,
              admin: {
                description: 'UPS Password',
              },
              hooks: {
                beforeChange: [
                  async ({ value }) => {
                    if (!value) return value
                    return await encrypt(value)
                  },
                ],
                afterRead: [
                  async ({ value }) => {
                    if (!value) return value
                    return await decrypt(value)
                  },
                ],
              },
            },
            {
              name: 'accountNumber',
              type: 'text',
              required: true,
              admin: {
                description: 'UPS Account Number',
              },
              hooks: {
                beforeChange: [
                  async ({ value }) => {
                    if (!value) return value
                    return await encrypt(value)
                  },
                ],
                afterRead: [
                  async ({ value }) => {
                    if (!value) return value
                    return await decrypt(value)
                  },
                ],
              },
            },
          ],
        },
        {
          name: 'services',
          type: 'group',
          fields: [
            {
              name: 'ground',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable UPS Ground',
                  },
                },
                {
                  name: 'code',
                  type: 'text',
                  defaultValue: '03',
                  admin: {
                    description: 'UPS Ground service code',
                  },
                },
                {
                  name: 'markup',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Percentage markup on this service',
                  },
                },
              ],
            },
            {
              name: 'threeDaySelect',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable UPS 3 Day Select',
                  },
                },
                {
                  name: 'code',
                  type: 'text',
                  defaultValue: '12',
                  admin: {
                    description: 'UPS 3 Day Select service code',
                  },
                },
                {
                  name: 'markup',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Percentage markup on this service',
                  },
                },
              ],
            },
            {
              name: 'secondDayAir',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable UPS 2nd Day Air',
                  },
                },
                {
                  name: 'code',
                  type: 'text',
                  defaultValue: '02',
                  admin: {
                    description: 'UPS 2nd Day Air service code',
                  },
                },
                {
                  name: 'markup',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Percentage markup on this service',
                  },
                },
              ],
            },
            {
              name: 'nextDayAir',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable UPS Next Day Air',
                  },
                },
                {
                  name: 'code',
                  type: 'text',
                  defaultValue: '01',
                  admin: {
                    description: 'UPS Next Day Air service code',
                  },
                },
                {
                  name: 'markup',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Percentage markup on this service',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    // FedEx Configuration
    {
      name: 'fedexConfig',
      type: 'group',
      admin: {
        description: 'FedEx API Configuration',
        condition: (data) => data.carrier === 'fedex',
      },
      fields: [
        {
          name: 'credentials',
          type: 'group',
          fields: [
            {
              name: 'apiKey',
              type: 'text',
              required: true,
              admin: {
                description: 'FedEx API Key',
              },
            },
            {
              name: 'secretKey',
              type: 'text',
              required: true,
              admin: {
                description: 'FedEx Secret Key',
              },
            },
            {
              name: 'accountNumber',
              type: 'text',
              required: true,
              admin: {
                description: 'FedEx Account Number',
              },
            },
            {
              name: 'meterNumber',
              type: 'text',
              required: true,
              admin: {
                description: 'FedEx Meter Number',
              },
            },
          ],
        },
        {
          name: 'services',
          type: 'group',
          fields: [
            {
              name: 'ground',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable FedEx Ground',
                  },
                },
                {
                  name: 'code',
                  type: 'text',
                  defaultValue: 'FEDEX_GROUND',
                  admin: {
                    description: 'FedEx Ground service code',
                  },
                },
                {
                  name: 'markup',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Percentage markup on this service',
                  },
                },
              ],
            },
            {
              name: 'express',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable FedEx Express Saver',
                  },
                },
                {
                  name: 'code',
                  type: 'text',
                  defaultValue: 'FEDEX_EXPRESS_SAVER',
                  admin: {
                    description: 'FedEx Express service code',
                  },
                },
                {
                  name: 'markup',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Percentage markup on this service',
                  },
                },
              ],
            },
            {
              name: 'twoDayAir',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable FedEx 2 Day',
                  },
                },
                {
                  name: 'code',
                  type: 'text',
                  defaultValue: 'FEDEX_2_DAY',
                  admin: {
                    description: 'FedEx 2 Day service code',
                  },
                },
                {
                  name: 'markup',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Percentage markup on this service',
                  },
                },
              ],
            },
            {
              name: 'priorityOvernight',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable FedEx Priority Overnight',
                  },
                },
                {
                  name: 'code',
                  type: 'text',
                  defaultValue: 'PRIORITY_OVERNIGHT',
                  admin: {
                    description: 'FedEx Priority Overnight service code',
                  },
                },
                {
                  name: 'markup',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Percentage markup on this service',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    // LTL Settings
    {
      name: 'ltlSettings',
      type: 'group',
      admin: {
        description: 'LTL Freight-specific settings',
      },
      fields: [
        {
          name: 'enableLTL',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Enable LTL freight shipping',
          },
        },
        {
          name: 'ltlThreshold',
          type: 'number',
          admin: {
            description: 'Order weight (lbs) at which to switch to LTL shipping',
          },
        },
        {
          name: 'freightClass',
          type: 'select',
          options: [
            { label: 'Class 50', value: '50' },
            { label: 'Class 55', value: '55' },
            { label: 'Class 60', value: '60' },
            { label: 'Class 65', value: '65' },
            { label: 'Class 70', value: '70' },
            { label: 'Class 77.5', value: '77.5' },
            { label: 'Class 85', value: '85' },
            { label: 'Class 92.5', value: '92.5' },
            { label: 'Class 100', value: '100' },
            { label: 'Class 110', value: '110' },
            { label: 'Class 125', value: '125' },
            { label: 'Class 150', value: '150' },
            { label: 'Class 175', value: '175' },
            { label: 'Class 200', value: '200' },
            { label: 'Class 250', value: '250' },
            { label: 'Class 300', value: '300' },
            { label: 'Class 400', value: '400' },
            { label: 'Class 500', value: '500' },
          ],
          admin: {
            description: 'Default NMFC freight class for LTL shipments',
          },
        },
        {
          name: 'markup',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Percentage markup on LTL shipments',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // If this config is being set to active, deactivate others for the same carrier
        if (data.isActive) {
          await req.payload.update({
            collection: 'shipping-carriers',
            where: {
              and: [
                {
                  carrier: {
                    equals: data.carrier,
                  },
                },
                {
                  id: {
                    not_equals: data.id || 'new',
                  },
                },
              ],
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
