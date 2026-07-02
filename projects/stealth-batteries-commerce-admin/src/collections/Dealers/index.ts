import type { CollectionConfig, PayloadRequest, Where, Access } from 'payload'
import { isAdmin, canAccessAdmin, isAdminFieldLevel } from '@/access/is-admin'
import { DealerVerified } from '@/email/templates/DealerVerified'
import { DealerRegistrationNotification } from '@/email/templates/DealerRegistrationNotification'
import { DealerWelcome } from '@/email/templates/DealerWelcome'
import { DealerEmailVerifiedNotification } from '@/email/templates/DealerEmailVerifiedNotification'

type DealerUser = {
  id?: string | number
  collection?: string
  canAccessAdmin?: boolean
  verified?: boolean
}

type SalesRepUser = {
  id?: string | number
  collection?: string
  active?: boolean
}

export const Dealers: CollectionConfig = {
  slug: 'dealers',
  auth: {
    useAPIKey: false,
    verify: {
      generateEmailSubject: () =>
        'Welcome to Stealth Batteries Dealer Program – Please Verify Your Email First',
      generateEmailHTML: ({ token, user }) => {
        const dealerWithLink = {
          ...user,
          verificationLink: `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}`,
        }
        return DealerWelcome({ dealer: dealerWithLink })
      },
    },
  },
  admin: {
    useAsTitle: 'companyName',
    defaultColumns: ['email', 'companyName', 'contactName', 'verified'],
    description: 'Dealers who can access special pricing and features',
    listSearchableFields: ['companyName', 'email', 'contactName'],
  },
  access: {
    read: ({ req }: { req: PayloadRequest }): boolean | Where => {
      // Admins can read all dealers
      if (isAdmin({ req })) return true

      const typedUser = req.user as unknown as DealerUser | SalesRepUser

      // For non-authenticated requests (like during login), only allow reading verified dealers
      if (!req.user) {
        return {
          verified: {
            equals: true,
          },
        }
      }

      // Verified dealers can only read themselves
      if (typedUser?.collection === 'dealers' && (typedUser as DealerUser)?.verified) {
        return {
          id: {
            equals: typedUser.id,
          },
        }
      }

      // Active sales reps can read dealers assigned to them
      if (typedUser?.collection === 'salesReps' && (typedUser as SalesRepUser)?.active) {
        return {
          salesRep: {
            equals: typedUser.id,
          },
        }
      }

      // All other cases are denied
      return false
    },
    create: (): boolean => true,
    update: ({ req }: { req: PayloadRequest }): boolean | Where => {
      // Admins can update all dealers
      if (isAdmin({ req })) return true

      const typedUser = req.user as unknown as DealerUser
      if (typedUser?.collection === 'dealers' && typedUser?.verified) {
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
    beforeLogin: [
      async ({ user }) => {
        if (!user.verified) {
          const error = new Error(
            'There was a problem logging in. Please contact Stealth Batteries at (877) 277-2025 or sales@stealthbatteries.com for support.',
          )
          // Prevent stack trace from being logged
          error.stack = ''
          ;(error as any).status = 401
          throw error
        }
        return user
      },
    ],
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        if (operation === 'create') {
          console.log('New dealer registration:', doc.email)
          try {
            const payload = req.payload
            await payload.sendEmail({
              to: process.env.STEALTH_NOTIFICATION_EMAIL,
              from: process.env.RESEND_FROM_EMAIL || 'noreply@stealthbatteries.com',
              subject: `New Dealer Registration Received: ${doc.companyName}`,
              html: DealerRegistrationNotification({ dealer: doc }),
            })
            console.log('Dealer registration notification sent to admin')
          } catch (error) {
            console.error('Error sending dealer registration notification:', error)
          }
        }

        // Send email when dealer verifies their email address
        if (operation === 'update' && doc._verified && !previousDoc._verified) {
          console.log('Dealer email verified:', doc.email)
          try {
            const payload = req.payload
            await payload.sendEmail({
              to: process.env.STEALTH_NOTIFICATION_EMAIL,
              from: process.env.RESEND_FROM_EMAIL || 'noreply@stealthbatteries.com',
              subject: `Dealer Email Verified - Ready for Approval: ${doc.companyName}`,
              html: DealerEmailVerifiedNotification({ dealer: doc }),
            })
            console.log('Dealer email verification notification sent to admin')
          } catch (error) {
            console.error('Error sending dealer email verification notification:', error)
          }
        }

        // Send email when admin verifies a dealer
        if (operation === 'update' && doc.verified && !previousDoc.verified) {
          console.log('Dealer verified by admin:', doc.email)
          try {
            const payload = req.payload
            await payload.sendEmail({
              to: doc.email,
              from: process.env.RESEND_FROM_EMAIL || 'noreply@stealthbatteries.com',
              subject: 'Your Stealth Batteries Dealer Account is Approved!',
              html: DealerVerified({ dealer: doc }),
            })
          } catch (error) {
            console.error('Error sending dealer verification email:', error)
          }
        }
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        // Handle custom pricing tracking
        if (data && Array.isArray(data.customPrices)) {
          data.customPrices = data.customPrices.map((entry: any) => {
            // Only set createdBy and createdAt if they don't already exist (new entries)
            if (!entry.createdBy && !entry.createdAt) {
              const updatedEntry = {
                ...entry,
                createdAt: new Date().toISOString(),
              }

              // Only set createdBy if user is an admin and has a valid ID
              if (req.user?.id && req.user?.collection === 'users') {
                updatedEntry.createdBy = req.user.id
              }

              return updatedEntry
            }
            return entry
          })
        }

        // Only geocode if address fields have changed or it's a new dealer
        if (operation === 'create' || (operation === 'update' && data.address)) {
          try {
            const apiKey = process.env.ST_GEOCODING_KEY
            if (!apiKey) {
              throw new Error('Geocoding API key is not configured')
            }

            // Construct the address string
            const addressString = [
              data.address.line1,
              data.address.line2,
              data.address.city,
              data.address.state,
              data.address.zip,
            ]
              .filter(Boolean)
              .join(', ')

            const response = await fetch('https://geocode.solheim.tech/api/v1/geocode', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
              },
              body: JSON.stringify({
                address: addressString,
                options: {
                  country: 'US',
                },
              }),
            })

            const result = await response.json()

            if (result.success && result.results?.[0]) {
              data.coordinates = {
                latitude: result.results[0].latitude,
                longitude: result.results[0].longitude,
              }
            } else {
              console.error('Geocoding failed:', result)
              throw new Error(result.error || 'Failed to geocode address')
            }
          } catch (error) {
            console.error('Error geocoding address:', error)
            throw new Error('Failed to geocode address')
          }
        }

        // Handle sales rep assignment history tracking
        if (operation === 'update' && data.salesRep !== undefined && req.data?.id) {
          try {
            // Get the current dealer data to compare
            const currentDealer = await req.payload.findByID({
              collection: 'dealers',
              id: req.data.id,
              depth: 1,
            })

            const currentSalesRepId =
              typeof currentDealer.salesRep === 'object'
                ? currentDealer.salesRep?.id
                : currentDealer.salesRep

            const newSalesRepId =
              typeof data.salesRep === 'object' ? data.salesRep?.id : data.salesRep

            // Only update history if the sales rep assignment actually changed
            if (currentSalesRepId !== newSalesRepId) {
              const now = new Date().toISOString()
              const assignmentHistory = [
                ...((currentDealer as any).salesRepAssignmentHistory || []),
              ]

              // End the current assignment if there is one
              if (currentSalesRepId) {
                const currentAssignmentIndex = assignmentHistory.findIndex(
                  (assignment: any) =>
                    assignment.salesRep === currentSalesRepId && !assignment.unassignedAt,
                )

                if (currentAssignmentIndex !== -1) {
                  assignmentHistory[currentAssignmentIndex] = {
                    ...assignmentHistory[currentAssignmentIndex],
                    unassignedAt: now,
                  }
                }
              }

              // Add new assignment if a sales rep is being assigned
              if (newSalesRepId) {
                assignmentHistory.push({
                  salesRep: newSalesRepId,
                  assignedAt: now,
                  assignedBy: req.user?.id || null,
                  notes: `Assignment updated via admin interface`,
                })
              }

              ;(data as any).salesRepAssignmentHistory = assignmentHistory
            }
          } catch (error) {
            console.error('Error updating sales rep assignment history:', error)
            // Don't throw error here to avoid breaking the update process
          }
        }

        // Handle initial assignment for new dealers
        if (operation === 'create' && data.salesRep) {
          const salesRepId = typeof data.salesRep === 'object' ? data.salesRep?.id : data.salesRep
          if (salesRepId) {
            ;(data as any).salesRepAssignmentHistory = [
              {
                salesRep: salesRepId,
                assignedAt: new Date().toISOString(),
                assignedBy: req.user?.id || null,
                notes: 'Initial assignment during dealer creation',
              },
            ]
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'companyName',
      type: 'text',
      required: true,
    },
    {
      name: 'contactName',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the primary contact for this dealer account',
      },
    },
    {
      name: 'phoneNumber',
      type: 'text',
      required: true,
    },
    {
      name: 'address',
      type: 'group',
      label: 'Billing Address',
      fields: [
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
          name: 'zip',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'useShippingAddress',
      type: 'checkbox',
      defaultValue: false,
      label: 'Use Different Shipping Address',
      admin: {
        description: 'Check this if shipping address is different from billing address',
      },
    },
    {
      name: 'shippingAddress',
      type: 'group',
      label: 'Shipping Address',
      admin: {
        condition: (data) => Boolean(data?.useShippingAddress),
      },
      fields: [
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
          name: 'zip',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'taxExemptDocuments',
      type: 'array',
      label: 'Tax Exemption Documents',
      admin: {
        description: 'Upload tax exemption certificates and related documents',
      },
      fields: [
        {
          name: 'document',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Resale Certificate', value: 'resale' },
            { label: 'Tax Exemption Certificate', value: 'exemption' },
            { label: 'Other Supporting Document', value: 'other' },
          ],
        },
        {
          name: 'expirationDate',
          type: 'date',
          admin: {
            description: 'When does this document expire? (if applicable)',
          },
        },
        {
          name: 'notes',
          type: 'textarea',
          admin: {
            description: 'Any additional notes about this document',
          },
        },
      ],
    },
    {
      name: 'taxExemptStatus',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'Not Applied', value: 'none' },
        { label: 'Application Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      access: {
        read: () => true,
        update: isAdminFieldLevel,
      },
      admin: {
        description: 'Current status of tax exemption application',
        position: 'sidebar',
      },
    },
    {
      name: 'taxExemptNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about tax exempt status',
        position: 'sidebar',
      },
      access: {
        read: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
    },
    {
      name: 'coordinates',
      type: 'group',
      admin: {
        description: 'Automatically generated from address',
      },
      access: {
        read: () => true,
        update: isAdminFieldLevel,
      },
      fields: [
        {
          name: 'latitude',
          type: 'number',
          required: true,
          min: -90,
          max: 90,
        },
        {
          name: 'longitude',
          type: 'number',
          required: true,
          min: -180,
          max: 180,
        },
      ],
    },
    {
      name: 'serviceArea',
      type: 'group',
      admin: {
        description: 'Define the service coverage area for this dealer',
      },
      fields: [
        {
          name: 'radius',
          type: 'number',
          label: 'Service Radius (miles)',
          min: 0,
          max: 500,
          defaultValue: 50,
          required: true,
        },
        {
          name: 'willTravel',
          type: 'checkbox',
          label: 'Willing to travel beyond service area',
          defaultValue: false,
        },
        {
          name: 'travelNotes',
          type: 'textarea',
          label: 'Travel/Service Notes',
          admin: {
            description: 'Additional notes about service area or travel capabilities',
          },
        },
      ],
    },
    {
      name: 'adminApprovalSection',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/admin/AdminApprovalSection',
        },
      },
    },
    {
      name: 'verified',
      label: 'Admin Approved',
      type: 'checkbox',
      defaultValue: false,
      access: {
        read: () => true,
        update: isAdminFieldLevel,
      },
      admin: {
        description: 'Has this dealer been verified by an admin?',
        position: 'sidebar',
      },
    },
    {
      name: 'emailVerification',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/admin/ResendVerificationButton',
        },
      },
    },
    {
      name: 'discountTier',
      type: 'relationship',
      relationTo: 'discount-tiers',
      required: false,
      access: {
        read: () => true,
        update: isAdminFieldLevel,
      },
      admin: {
        description: 'The discount tier for this dealer',
        position: 'sidebar',
      },
    },
    {
      name: 'salesRep',
      type: 'relationship',
      relationTo: 'salesReps',
      required: false,
      access: {
        read: () => true,
        update: isAdminFieldLevel,
      },
      admin: {
        description: 'The sales representative assigned to this dealer',
        position: 'sidebar',
      },
    },
    {
      name: 'salesRepAssignmentHistory',
      type: 'array',
      admin: {
        description: 'Complete history of sales rep assignments for this dealer',
        position: 'sidebar',
      },
      access: {
        read: () => true,
        update: isAdminFieldLevel,
      },
      fields: [
        {
          name: 'salesRep',
          type: 'relationship',
          relationTo: 'salesReps',
          required: true,
          admin: {
            description: 'The sales representative for this assignment period',
          },
        },
        {
          name: 'assignedAt',
          type: 'date',
          required: true,
          admin: {
            description: 'When this dealer was assigned to this sales rep',
          },
          hooks: {
            beforeValidate: [
              async ({ value, operation }) => {
                // Auto-populate assignment date for new assignments
                if (!value && operation === 'create') {
                  return new Date().toISOString()
                }
                return value
              },
            ],
          },
        },
        {
          name: 'unassignedAt',
          type: 'date',
          admin: {
            description: 'When this assignment ended (null if current assignment)',
          },
        },
        {
          name: 'assignedBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'Admin who made this assignment',
          },
        },
        {
          name: 'notes',
          type: 'textarea',
          admin: {
            description: 'Optional notes about this assignment',
          },
        },
      ],
    },
    {
      name: 'taxExempt',
      type: 'checkbox',
      defaultValue: false,
      access: {
        read: () => true,
        update: isAdminFieldLevel,
      },
      admin: {
        description: 'Is this dealer exempt from paying tax?',
        position: 'sidebar',
      },
    },
    {
      name: 'forcePasswordChange',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Force the dealer to change their password on next login',
      },
    },
    {
      name: 'customShipping',
      type: 'group',
      label: 'Custom Shipping',
      admin: {
        description: 'Custom shipping options for this dealer',
      },
      fields: [
        {
          name: 'hasFreeShipping',
          type: 'checkbox',
          label: 'Allow Free Shipping',
          admin: {
            description: 'If checked, this dealer always gets free shipping.',
          },
        },
        {
          name: 'customPrice',
          type: 'number',
          label: 'Custom Shipping Price',
          admin: {
            description:
              'If set, this dealer will be charged this shipping price instead of UPS rates.',
          },
        },
      ],
    },
    {
      name: 'customPrices',
      label: 'Custom Product Prices',
      type: 'array',
      admin: {
        description:
          'Set a fixed price or discount for specific products for this dealer. Only one of Fixed Price or Discount (%) can be set per product.',
        components: {
          RowLabel: '@/collections/Dealers/RowLabel#RowLabel',
        },
      },
      fields: [
        {
          name: 'name',
          label: 'Custom Price Name',
          type: 'text',
          required: true,
          admin: {
            description:
              'A descriptive name for this custom price (e.g., "Bulk Order Discount", "VIP Customer Rate", etc.)',
          },
        },
        {
          name: 'product',
          label: 'Product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'fixedPrice',
          label: 'Fixed Price',
          type: 'number',
          required: false,
          validate: (value, { data }) => {
            if (value && data.discountPercent) {
              return 'Cannot set both Fixed Price and Discount %. Please clear the Discount % field first.'
            }
            return true
          },
          admin: {
            description: 'Set a fixed price for this product (cannot be used with discount %)',
          },
        },
        {
          name: 'discountPercent',
          label: 'Discount (%)',
          type: 'number',
          required: false,
          min: 0,
          max: 100,
          validate: (value, { data }) => {
            if (value && data.fixedPrice) {
              return 'Cannot set both Discount % and Fixed Price. Please clear the Fixed Price field first.'
            }
            return true
          },
          admin: {
            description:
              'Set a discount percentage for this product (cannot be used with fixed price)',
          },
        },
        {
          name: 'createdBy',
          label: 'Created By',
          type: 'relationship',
          relationTo: 'users',
          required: false,
          admin: {
            description: 'Admin who created this custom price (autopopulated on save)',
            readOnly: true,
          },
          access: {
            read: () => true,
            update: () => false,
          },
        },
        {
          name: 'createdAt',
          label: 'Time And Date',
          type: 'date',
          required: false,
          admin: {
            description: 'When this custom price was created (autopopulated on save)',
            readOnly: true,
          },
          access: {
            read: () => true,
            update: () => false,
          },
        },
      ],
      validate: (customPrices) => {
        if (!Array.isArray(customPrices)) return true
        for (const entry of customPrices) {
          const e = entry as { fixedPrice?: number; discountPercent?: number }
          if (e.fixedPrice && e.discountPercent) {
            return 'Only one of Fixed Price or Discount (%) can be set per product.'
          }
        }
        return true
      },
    },
  ],
}
