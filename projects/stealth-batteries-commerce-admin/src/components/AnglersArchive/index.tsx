import { cn } from '@/utilities/ui'
import React from 'react'

import type { CardPostData } from '@/components/Card'
import { AnglerCard } from '@/components/AnglerCard'

export type Props = {
  posts?: CardPostData[]
}

export const AnglersArchive: React.FC<Props> = (props) => {
  const { posts } = props

  return (
    <div className={cn('container')}>
      <div>
        {posts?.map((result, index) => {
          if (typeof result === 'object' && result !== null) {
            return (
              <div key={index}>
                <AnglerCard doc={result} relationTo="posts" showCategories={false} />
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
