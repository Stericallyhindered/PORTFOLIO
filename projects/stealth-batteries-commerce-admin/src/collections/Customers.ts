import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/is-admin'
import { isAdminorSelf } from '@/access/is-admin-or-self'

export const Customers: CollectionConfig = {
  slug: 'customers',
  access: {
    create: async ({ req }) => {
      // Allow creation during checkout
      if (req.url?.includes('/checkout/stripe')) {
        return true
      }
      return isAdmin({ req })
    },
    delete: isAdmin,
    read: isAdminorSelf,
    update: isAdmin,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'stripeCustomerId', 'createdAt'],
    group: 'Shop',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      required: false,
      admin: {
        description: 'Full name (used for Stripe)',
      },
    },
    {
      name: 'firstName',
      type: 'text',
      required: false,
      admin: {
        description: 'First name (for internal use)',
      },
    },
    {
      name: 'lastName',
      type: 'text',
      required: false,
      admin: {
        description: 'Last name (for internal use)',
      },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The Stripe Customer ID associated with this customer',
      },
    },
    {
      name: 'phone',
      type: 'text',
      required: false,
      admin: {
        description: 'Customer phone number',
      },
    },
    {
      name: 'shippingAddresses',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            description: 'Full name for shipping',
          },
        },
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
        {
          name: 'lastName',
          type: 'text',
          required: true,
        },
        {
          name: 'line1',
          type: 'text',
          required: true,
        },
        {
          name: 'line2',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
          required: true,
        },
        {
          name: 'state',
          type: 'text',
          required: true,
        },
        {
          name: 'postalCode',
          type: 'text',
          required: true,
        },
        {
          name: 'country',
          type: 'text',
          required: true,
          defaultValue: 'US',
        },
        {
          name: 'isDefault',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'billingAddresses',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            description: 'Full name for billing',
          },
        },
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
        {
          name: 'lastName',
          type: 'text',
          required: true,
        },
        {
          name: 'line1',
          type: 'text',
          required: true,
        },
        {
          name: 'line2',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
          required: true,
        },
        {
          name: 'state',
          type: 'text',
          required: true,
        },
        {
          name: 'postalCode',
          type: 'text',
          required: true,
        },
        {
          name: 'country',
          type: 'text',
          required: true,
          defaultValue: 'US',
        },
        {
          name: 'isDefault',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data) return data

        // Handle name fields
        if (operation === 'create' || operation === 'update') {
          // If firstName and lastName are provided but name isn't, combine them
          if (data.firstName && data.lastName && !data.name) {
            data.name = `${data.firstName} ${data.lastName}`
          }
          // If name is provided but firstName/lastName aren't, split it
          else if (data.name && (!data.firstName || !data.lastName)) {
            const nameParts = data.name.split(' ')
            data.firstName = nameParts[0]
            data.lastName = nameParts.slice(1).join(' ') || nameParts[0]
          }

          // Handle shipping/billing address names
          if (data.shippingAddresses?.length) {
            data.shippingAddresses = data.shippingAddresses.map((addr: any) => {
              if (!addr) return addr
              if (addr.firstName && addr.lastName && !addr.name) {
                addr.name = `${addr.firstName} ${addr.lastName}`
              } else if (addr.name && (!addr.firstName || !addr.lastName)) {
                const nameParts = addr.name.split(' ')
                addr.firstName = nameParts[0]
                addr.lastName = nameParts.slice(1).join(' ') || nameParts[0]
              }
              return addr
            })
          }

          if (data.billingAddresses?.length) {
            data.billingAddresses = data.billingAddresses.map((addr: any) => {
              if (!addr) return addr
              if (addr.firstName && addr.lastName && !addr.name) {
                addr.name = `${addr.firstName} ${addr.lastName}`
              } else if (addr.name && (!addr.firstName || !addr.lastName)) {
                const nameParts = addr.name.split(' ')
                addr.firstName = nameParts[0]
                addr.lastName = nameParts.slice(1).join(' ') || nameParts[0]
              }
              return addr
            })
          }
        }

        return data
      },
    ],
    beforeChange: [
      async ({ req, data, operation }) => {
        if (operation === 'create') {
          // Check if customer already exists by email
          const existingCustomer = await req.payload.find({
            collection: 'customers',
            where: {
              email: {
                equals: data.email,
              },
            },
          })

          if (existingCustomer.docs.length > 0) {
            // Return existing customer data to prevent duplicate creation
            return existingCustomer.docs[0]
          }
        }
        return data
      },
    ],
  },
  timestamps: true,
}
