import type { Access } from 'payload'
import { User } from '../payload-types'

type PayloadUser = User & {
  canAccessAdmin?: boolean
  collection: 'users'
}

export const adminOrPublished: Access = ({ req: { user } }) => {
  if (user) {
    if ((user as PayloadUser)?.canAccessAdmin) {
      return true
    }
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
