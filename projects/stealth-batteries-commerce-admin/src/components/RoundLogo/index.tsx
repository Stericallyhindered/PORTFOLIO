import clsx from 'clsx'
import React from 'react'
import Image from 'next/image'
interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const RoundLogo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    <Image
      alt="Stealth Lithium Batteries Logo"
      width={144}
      height={100}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      quality={50}
      className={clsx('max-w-[12rem] w-full h-full', className)}
      src="https://i1vip8txhmugx0q6.public.blob.vercel-storage.com/stealth-batteries/static-site-images/logo/Stealth%20final%20logo-02.png"
    />
  )
}
