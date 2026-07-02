'use client'
import React from 'react'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const RowLabel: React.FC<RowLabelProps> = (props) => {
  const data = useRowLabel<{
    name?: string
    product?: string | { title?: string }
    fixedPrice?: number
    discountPercent?: number
  }>()

  if (data?.data?.name) {
    return <span>{data.data.name}</span>
  }

  // Fallback to the old numbering system if no name is provided
  return (
    <span>{`Custom Price ${String(data.rowNumber !== undefined ? data.rowNumber + 1 : '').padStart(3, '0')}`}</span>
  )
}
