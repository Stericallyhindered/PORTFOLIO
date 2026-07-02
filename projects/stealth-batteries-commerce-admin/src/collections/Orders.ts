import type { CollectionConfig, Access, Where } from 'payload'
import { isAdmin } from '@/access/is-admin'
import { isAdminorSelf } from '@/access/is-admin-or-self'
import crypto from 'crypto'
import { OrderConfirmationEmail } from '@/email/templates/OrderConfirmation'
import { OrderNotificationEmail } from '@/email/templates/OrderNotification'
import { LowStockNotificationEmail } from '@/email/templates/LowStockNotification'
import type { Customer, Order } from '@/payload-types'

type OrderUser = {
  id?: string | number
  collection?: string
  canAccessAdmin?: boolean
}

type SalesRepUser = {
  id?: string | number
  collection?: string
  active?: boolean
}

type PopulatedOrder = Omit<Order, 'customer'> & {
  customer: Customer
}

// Helper function to reduce inventory for an order
async function reduceInventoryForOrder(order: any, payload: any) {
  if (!Array.isArray(order.items)) return

  for (const item of order.items) {
    try {
      const product = await payload.findByID({
        collection: 'products',
        id: typeof item.product === 'object' ? item.product.id : item.product,
      })

      if (product?.inventory?.trackInventory) {
        // Calculate new inventory quantity
        const newQuantity = Math.max(0, (product.inventory.quantity || 0) - item.quantity)

        // Update product inventory
        await payload.update({
          collection: 'products',
          id: product.id,
          data: {
            inventory: {
              ...product.inventory,
              quantity: newQuantity,
            },
          },
        })

        // If inventory is at or below threshold, send notification
        if (newQuantity <= (product.inventory.lowStockThreshold || 0)) {
          // Send low stock notification email
          if (process.env.STEALTH_NOTIFICATION_EMAIL) {
            await payload.sendEmail({
              to: process.env.STEALTH_NOTIFICATION_EMAIL,
              subject: `Low Stock Alert - ${product.title}`,
              html: LowStockNotificationEmail({
                product,
                currentStock: newQuantity,
                lowStockThreshold: product.inventory.lowStockThreshold || 0,
              }),
            })
          }
        }
      }

      // If there's a variant, update its inventory too
      if (item.variant && product.variants) {
        const variantGroup = product.variants.find((v) => v.name === item.variant.name)
        if (variantGroup && Array.isArray(variantGroup.options)) {
          const variantOption = variantGroup.options.find((o) => o.value === item.variant.value)
          if (variantOption && typeof variantOption.inventory === 'number') {
            const newVariantQuantity = Math.max(0, variantOption.inventory - item.quantity)

            // Update variant inventory
            await payload.update({
              collection: 'products',
              id: product.id,
              data: {
                variants: product.variants.map((v) =>
                  v.name === item.variant.name && Array.isArray(v.options)
                    ? {
                        ...v,
                        options: v.options.map((o) =>
                          o.value === item.variant.value
                            ? { ...o, inventory: newVariantQuantity }
                            : o,
                        ),
                      }
                    : v,
                ),
              },
            })
          }
        }
      }
    } catch (error) {
      console.error('Error updating product inventory:', {
        productId: item.product,
        error: error.message,
      })
    }
  }
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    create: async ({ req, data }) => {
      // Allow public access for order creation during checkout
      if (req.url?.includes('/checkout/stripe')) {
        return true
      }
      return false
    },
    delete: isAdmin,
    read: ({ req }): boolean | Where => {
      // If user is admin, they can read all orders
      if (isAdmin({ req })) {
        return true
      }

      const typedUser = req.user as OrderUser | SalesRepUser | null

      // If no user, deny access
      if (!typedUser) {
        return false
      }

      // For dealers and customers, allow access to their own orders
      if (typedUser.collection === 'dealers') {
        return {
          dealer: {
            equals: typedUser.id,
          },
        }
      }

      if (typedUser.collection === 'customers') {
        return {
          customer: {
            equals: typedUser.id,
          },
        }
      }

      // Active sales reps can read orders from dealers assigned to them
      if (typedUser.collection === 'salesReps' && (typedUser as SalesRepUser)?.active) {
        return {
          'dealer.salesRep': {
            equals: typedUser.id,
          },
        }
      }

      // Deny access by default
      return false
    },
    update: async ({ req }) => {
      // Debug logging for access control

      // Allow admin updates
      if (isAdmin({ req })) {
        return true
      }

      return false
    },
  },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: [
      'orderNumber',
      'customer',
      'dealer',
      'total',
      'dealerTotal',
      'status',
      'createdAt',
    ],
    group: 'Shop',
    preview: (doc) => `Order #${doc.orderNumber}`,
  },
  fields: [
    {
      name: 'uuid',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Secure UUID for public order identification',
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          async ({ value, operation }) => {
            if (!value && operation === 'create') {
              // Generate a random UUID (v4)
              return crypto.randomUUID()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'orderNumber',
      type: 'number',
      required: false,
      unique: true,
      admin: {
        description: 'Automatically generated sequential order number',
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          async ({ req, value, operation }) => {
            if (!value && operation === 'create') {
              const orders = await req.payload.find({
                collection: 'orders',
                sort: '-orderNumber',
                limit: 1,
              })
              const lastOrder = orders.docs[0]
              return lastOrder ? (lastOrder.orderNumber || 0) + 1 : 1000
            }
            return value
          },
        ],
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      admin: {
        allowCreate: false,
      },
    },
    {
      name: 'dealer',
      type: 'relationship',
      relationTo: 'dealers',
      admin: {
        description: 'The dealer who placed this order (if applicable)',
        position: 'sidebar',
        allowCreate: false,
      },
      filterOptions: ({ relationTo, data }) => {
        // Ensure we can see all verified dealers
        return {
          verified: { equals: true },
        }
      },
    },
    {
      name: 'affiliate',
      type: 'relationship',
      relationTo: 'affiliates',
      admin: {
        description: 'The affiliate who referred this order (if applicable)',
        position: 'sidebar',
        allowCreate: false,
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          admin: {
            description: 'Product reference',
            allowCreate: false,
          },
          hooks: {
            beforeValidate: [
              async ({ value }) => {
                // Handle null/undefined
                if (value === null || value === undefined) return value

                // Convert to number if possible
                const numericValue = Number(value)
                if (!isNaN(numericValue)) {
                  return numericValue
                }

                // If we can't convert to number, return original value
                // This allows for potential string IDs in the future
                return value
              },
            ],
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'variant',
          type: 'group',
          fields: [
            {
              name: 'name',
              type: 'text',
            },
            {
              name: 'value',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'tax',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'taxExempt',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Indicates if this order is exempt from tax (e.g. for dealers)',
      },
    },
    {
      name: 'isDropship',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Indicates if this is a dropship order (shipped directly to customer)',
        position: 'sidebar',
      },
    },
    {
      name: 'shipping',
      type: 'number',
      required: true,
    },
    {
      name: 'shippingService',
      type: 'text',
      admin: {
        description: 'The selected UPS shipping service code',
      },
    },
    {
      name: 'trackingNumber',
      type: 'text',
      admin: {
        description: 'Main shipment tracking number',
      },
    },
    {
      name: 'packageTrackingNumbers',
      type: 'array',
      fields: [
        {
          name: 'number',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          admin: {
            description: 'Base64-encoded shipping label image',
          },
        },
      ],
      admin: {
        description: 'Individual package tracking numbers and labels',
      },
    },
    {
      name: 'shippedAt',
      type: 'date',
      admin: {
        description: 'When the order was shipped',
      },
    },
    {
      name: 'total',
      type: 'number',
      required: true,
    },
    {
      name: 'dealerTotal',
      type: 'number',
      required: false,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Total based on Dealer Price of all items',
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'processing',
      hasMany: false,
      admin: {
        description: 'Order status',
      },
      options: [
        { label: 'Pre-order', value: 'pre-order' },
        { label: 'Back-order', value: 'back-order' },
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
      hooks: {
        beforeChange: [
          async ({ value, data, req }) => {
            // If there's no data or items, return the original value
            if (!data?.items || !Array.isArray(data.items)) {
              return value
            }

            // Check if any items are pre-orders or back-orders
            const itemStatuses = await Promise.all(
              data.items.map(async (item) => {
                if (!item.product) return { isPreOrder: false, isBackOrder: false }
                const product = await req.payload.findByID({
                  collection: 'products',
                  id: typeof item.product === 'object' ? item.product.id : item.product,
                })
                return {
                  isPreOrder: product?.releaseDate && new Date(product.releaseDate) > new Date(),
                  isBackOrder:
                    product?.inventory?.trackInventory && product.inventory.quantity === 0,
                }
              }),
            )

            // If any item is a pre-order, set status to pre-order
            if (itemStatuses.some((status) => status.isPreOrder)) {
              return 'pre-order'
            }

            // If any item is out of stock (but not pre-order), set status to back-order
            if (itemStatuses.some((status) => status.isBackOrder)) {
              return 'back-order'
            }

            return value
          },
        ],
      },
    },
    {
      name: 'stripePaymentIntentId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The Stripe Payment Intent ID associated with this order',
      },
    },
    {
      name: 'discounts',
      type: 'group',
      fields: [
        {
          name: 'dealer',
          type: 'group',
          fields: [
            {
              name: 'percentage',
              type: 'number',
              min: 0,
              max: 100,
            },
            {
              name: 'tierId',
              type: 'number',
            },
            {
              name: 'tierName',
              type: 'text',
            },
            {
              name: 'amount',
              type: 'number',
              min: 0,
            },
            {
              name: 'volumeDiscountApplied',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'volumeDiscountThreshold',
              type: 'number',
              min: 0,
            },
            {
              name: 'volumeDiscountPercentage',
              type: 'number',
              min: 0,
              max: 100,
            },
            {
              name: 'volumeDiscountAmount',
              type: 'number',
              min: 0,
            },
          ],
        },
        {
          name: 'affiliate',
          type: 'group',
          fields: [
            {
              name: 'code',
              type: 'text',
            },
            {
              name: 'percentage',
              type: 'number',
              min: 0,
              max: 100,
            },
            {
              name: 'amount',
              type: 'number',
              min: 0,
            },
            {
              name: 'commission',
              type: 'number',
              min: 0,
            },
          ],
        },
        {
          name: 'discountCode',
          type: 'group',
          fields: [
            {
              name: 'code',
              type: 'text',
            },
            {
              name: 'type',
              type: 'select',
              options: [
                { label: 'Percentage', value: 'percentage' },
                { label: 'Fixed', value: 'fixed' },
              ],
            },
            {
              name: 'amount',
              type: 'number',
              min: 0,
            },
          ],
        },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'group',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          required: false,
        },
        {
          name: 'lastName',
          type: 'text',
          required: false,
        },
        {
          name: 'phone',
          type: 'text',
          required: false,
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
      ],
    },
    {
      name: 'billingAddress',
      type: 'group',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          required: false,
        },
        {
          name: 'lastName',
          type: 'text',
          required: false,
        },
        {
          name: 'phone',
          type: 'text',
          required: false,
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
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        // Handle malformed admin data by parsing the _payload field
        if (data && data._payload && typeof data._payload === 'string') {
          try {
            console.log('Parsing malformed admin data in beforeValidate')
            const parsedData = JSON.parse(data._payload)
            console.log('Parsed data keys:', Object.keys(parsedData))
            return parsedData
          } catch (error) {
            console.error('Failed to parse _payload data:', error)
            return data
          }
        }

        console.log('Debug - beforeValidate:', {
          operation,
          dataKeys: Object.keys(data || {}),
          url: req?.url,
        })
        return data
      },
    ],
    beforeChange: [
      async ({ req, data, operation, originalDoc }) => {
        // Handle malformed admin data by parsing the _payload field
        if (data && data._payload && typeof data._payload === 'string') {
          try {
            console.log('Parsing malformed admin data in beforeChange')
            const parsedData = JSON.parse(data._payload)
            console.log('Parsed data keys:', Object.keys(parsedData))
            // Continue processing with the parsed data
            data = parsedData
          } catch (error) {
            console.error('Failed to parse _payload data:', error)
            return data
          }
        }

        console.log('Debug - beforeChange:', {
          operation,
          dataKeys: Object.keys(data || {}),
          url: req?.url,
        })

        // For admin updates, allow simple field updates without complex processing
        if (isAdmin({ req })) {
          // If this is just a simple field update (like dealer assignment), don't recalculate dealerTotal
          const isSimpleUpdate =
            !data.items ||
            (originalDoc?.items && JSON.stringify(originalDoc.items) === JSON.stringify(data.items))

          if (isSimpleUpdate && data.dealerTotal === undefined) {
            return {
              ...data,
              dealerTotal: originalDoc?.dealerTotal || 0,
            }
          }

          return data
        }

        // Only calculate dealerTotal if items have changed or it's a new order
        if (operation === 'create' || (operation === 'update' && data.items)) {
          // Calculate Dealer total from items
          let dealerTotal = 0
          if (Array.isArray(data?.items)) {
            for (const item of data.items) {
              try {
                // Get the product to access its Dealer Price value
                const product = await req.payload.findByID({
                  collection: 'products',
                  id: typeof item.product === 'object' ? item.product.id : item.product,
                })

                // Use Dealer Price if available, fallback to product price
                const dealerPrice = product?.dealerPrice || product?.price || 0
                dealerTotal += dealerPrice * item.quantity
              } catch (error) {
                console.error('Error processing product for Dealer Price calculation:', {
                  productId: item.product,
                  error: error.message,
                })
              }
            }
          }

          return {
            ...data,
            dealerTotal,
          }
        }

        // If no items have changed and it's not an admin update, preserve the original dealerTotal
        if (originalDoc?.dealerTotal !== undefined) {
          return {
            ...data,
            dealerTotal: originalDoc.dealerTotal,
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // Only send emails and reduce inventory on create operation
        if (operation === 'create') {
          // Reduce inventory immediately after successful payment
          await reduceInventoryForOrder(doc, req.payload)

          try {
            // Populate the customer relationship to get their email
            const populatedDoc = (await req.payload.findByID({
              collection: 'orders',
              id: doc.id,
              depth: 1,
            })) as PopulatedOrder

            if (!populatedDoc?.customer?.email) {
              console.error('Could not find customer email for order:', doc.id)
              return doc
            }

            // Get detailed product information including model numbers
            const itemsWithDetails = await Promise.all(
              doc.items.map(async (item) => {
                const product = await req.payload.findByID({
                  collection: 'products',
                  id: typeof item.product === 'object' ? item.product.id : item.product,
                  depth: 0,
                })
                return {
                  title: item.title,
                  quantity: item.quantity,
                  price: item.price,
                  modelNumber: product?.modelNumber || undefined,
                }
              }),
            )

            // Prepare email data
            const emailData = {
              order: doc,
              items: itemsWithDetails,
            }

            // Send confirmation email to customer
            await req.payload.sendEmail({
              to: populatedDoc.customer.email,
              subject: `Order Confirmation #${doc.orderNumber}`,
              html: OrderConfirmationEmail(emailData),
            })

            // Add delay before sending notification email to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 2000))

            // Send notification email to Stealth Batteries staff
            if (process.env.STEALTH_NOTIFICATION_EMAIL) {
              await req.payload.sendEmail({
                to: process.env.STEALTH_NOTIFICATION_EMAIL,
                bcc: ['support+stealthbatteries@solheim.tech'],
                subject: `New Order #${doc.orderNumber} - ${doc.isDropship ? 'Dropship' : 'Standard'}${
                  doc.dealer ? ' - Dealer' : ''
                }`,
                html: OrderNotificationEmail(emailData),
              })
            }
          } catch (error) {
            console.error('Error sending order emails:', error)
          }
        }
        return doc
      },
    ],
  },
}
