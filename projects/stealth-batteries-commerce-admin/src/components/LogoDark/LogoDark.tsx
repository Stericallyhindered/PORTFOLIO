import clsx from 'clsx'
import React from 'react'
import Image from 'next/image'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const LogoDark = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  return (
    <Image
      src="/assets/SVG/Stealth final logo-12.svg"
      alt="Stealth Lithium Batteries Logo"
      width={386}
      height={68}
      priority={priorityFromProps === 'high'}
      className={clsx('w-full h-full invert', className)}
    />
  )
}
