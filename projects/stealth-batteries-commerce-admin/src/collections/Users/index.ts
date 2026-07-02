import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/is-admin'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
    tokenExpiration: 7200, // 2 hours
    verify: false,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'canAccessAdmin'],
    description: 'Admin users who can access the admin panel',
  },
  access: {
    read: isAdmin,
    // Only admins can create other admin users
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'canAccessAdmin',
      type: 'checkbox',
      required: true,
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Can this user access the admin panel?',
      },
    },
  ],
}
