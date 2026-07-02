import { Access, FieldAccess } from 'payload'

type AdminUser = {
  canAccessAdmin?: boolean
  id?: string | number
}

export const isAdmin: Access = ({ req: { user } }) => {
  const adminUser = user as AdminUser | null
  if (!adminUser) return false
  if (!adminUser.canAccessAdmin) return false
  return {
    id: { exists: true },
  }
}

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => {
  const adminUser = user as AdminUser | null
  if (!adminUser) return false
  return Boolean(adminUser.canAccessAdmin)
}

// Helper to check if user is admin or accessing their own resource
export const isAdminOrSelf: Access = ({ req: { user }, id }) => {
  const adminUser = user as AdminUser | null
  if (!adminUser) return false
  if (adminUser.canAccessAdmin) return true
  if (adminUser.id === id) return true
  return false
}

// For the admin UI access
export const canAccessAdmin: Access = ({ req: { user } }) => {
  const adminUser = user as AdminUser | null
  if (!adminUser) return false
  return Boolean(adminUser.canAccessAdmin)
}
