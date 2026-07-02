import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="Stealth Lithium Batteries Logo"
      width={300}
      height={500}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('max-w-[12rem] w-full h-[75px]', className)}
      src="/assets/SVG/Stealth final logo-13.svg"
    />
  )
}

export default Logo
