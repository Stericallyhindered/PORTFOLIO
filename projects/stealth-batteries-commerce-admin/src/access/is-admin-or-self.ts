import { AccessArgs } from 'payload'
import { User } from '../payload-types'

type PayloadUser = User & {
  canAccessAdmin?: boolean
  collection: 'users'
}

import { Access } from 'payload'

export const isAdminorSelf: Access = ({ req: { user } }: AccessArgs) => {
  if (user) {
    if ((user as PayloadUser | null)?.canAccessAdmin) {
      return true
    }

    return {
      id: {
        equals: user?.id,
      },
    }
  }

  return false
}
