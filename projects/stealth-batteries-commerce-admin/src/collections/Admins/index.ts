import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminFieldLevel } from '@/access/is-admin'

export const Admins: CollectionConfig = {
  slug: 'admins',
  access: {
    admin: ({ req }) => {
      const user = req.user as { canAccessAdmin?: boolean } | null
      return Boolean(user?.canAccessAdmin)
    },
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    hidden: true, // Hide from admin menu completely
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  timestamps: true,
}
