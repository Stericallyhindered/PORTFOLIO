import type { CollectionConfig, PayloadRequest, Where, Access } from 'payload'
import { isAdmin } from '@/access/is-admin'

type SalesRepUser = {
  id?: string | number
  collection?: string
  active?: boolean
}

export const SalesReps: CollectionConfig = {
  slug: 'salesReps',
  auth: {
    useAPIKey: false,
    verify: false,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
    tokenExpiration: 7200, // 2 hours
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'commissionRate', 'active'],
    description: 'Sales representatives who can access dealer orders and commissions',
    listSearchableFields: ['name', 'email'],
  },
  access: {
    // Only admins can read all sales reps, authenticated sales reps can only read themselves
    read: ({ req }: { req: PayloadRequest }): boolean | Where => {
      // Admins can read all sales reps
      if (isAdmin({ req })) return true

      const typedUser = req.user as unknown as SalesRepUser

      // Authenticated sales reps can only read themselves if they're active
      if (typedUser?.collection === 'salesReps' && typedUser?.active) {
        return {
          id: {
            equals: typedUser.id,
          },
        }
      }

      // All other cases are denied
      return false
    },
    // Only admins can create sales reps
    create: isAdmin,
    // Admins can update all, sales reps can only update themselves
    update: ({ req }: { req: PayloadRequest }): boolean | Where => {
      // Admins can update all sales reps
      if (isAdmin({ req })) return true

      const typedUser = req.user as unknown as SalesRepUser
      if (typedUser?.collection === 'salesReps' && typedUser?.active) {
        return {
          id: {
            equals: typedUser.id,
          },
        }
      }
      return false
    },
    // Only admins can delete sales reps
    delete: isAdmin,
    // Prevent sales reps from accessing admin UI
    admin: () => false,
  },
  hooks: {
    beforeLogin: [
      async ({ user }) => {
        if (!user.active) {
          const error = new Error(
            'Your sales representative account is currently inactive. Please contact your administrator for assistance.',
          )
          // Prevent stack trace from being logged
          error.stack = ''
          ;(error as any).status = 401
          throw error
        }
        return user
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the sales representative',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: false,
      options: [
        { label: 'Sales Representative', value: 'rep' },
        { label: 'Senior Representative', value: 'senior_rep' },
        { label: 'Junior Representative', value: 'junior_rep' },
        { label: 'Sales Manager', value: 'manager' },
        { label: 'Regional Manager', value: 'regional_manager' },
        { label: 'Director', value: 'director' },
      ],
      admin: {
        description: 'Role/position of the sales representative',
      },
    },
    {
      name: 'commissionRate',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      admin: {
        description: 'Commission rate as a percentage (0-100)',
        step: 0.01,
      },
    },
    {
      name: 'targetQuota',
      type: 'number',
      required: false,
      min: 0,
      admin: {
        description: 'Monthly/quarterly sales goal (optional)',
        step: 0.01,
      },
    },
    {
      name: 'commissionCalculationMethod',
      type: 'select',
      required: true,
      defaultValue: 'completed_orders',
      options: [
        {
          label: 'All Orders (Legacy)',
          value: 'all_orders',
        },
        {
          label: 'Completed Orders Only (Recommended)',
          value: 'completed_orders',
        },
      ],
      admin: {
        description: 'How commission should be calculated for this sales rep',
        position: 'sidebar',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Whether this sales rep can access the system',
      },
    },
  ],
}
