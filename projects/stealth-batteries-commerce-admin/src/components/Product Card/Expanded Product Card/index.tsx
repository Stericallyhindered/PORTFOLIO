'use client'
import { cn } from '@/utilities/ui'
import { ArrowLeft, X } from 'lucide-react'

import type { Product } from '@/payload-types'

import { createPortal } from 'react-dom'
import IsBatterySpecs from './isBattery'
import IsAccessorySpecs from './isAccessory'
import IsSwagSpecs from './isSwag'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ExpandedCardProps {
  product: Product
  onClose: () => void
  className?: string
}

export function ExpandedProductCard({ product, onClose, className }: ExpandedCardProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    // Lock scroll on html, body, and #__next (Next.js root), but allow modal to scroll
    const html = document.documentElement
    const body = document.body
    const nextRoot = document.getElementById('__next')
    const originalHtmlOverflow = html.style.overflow
    const originalBodyOverflow = body.style.overflow
    const originalNextOverflow = nextRoot?.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (nextRoot) nextRoot.style.overflow = 'hidden'
    return () => {
      html.style.overflow = originalHtmlOverflow
      body.style.overflow = originalBodyOverflow
      if (nextRoot && originalNextOverflow !== undefined)
        nextRoot.style.overflow = originalNextOverflow
    }
  }, [])

  // Check if the product is a battery based on product type
  const isBattery = product.productType === 'battery'
  const isAccessory = product.productType === 'accessory'
  const isSwag = product.productType === 'swag'

  // Check if the product should show bluetooth capability

  // Get battery specifications if available
  const specs = product.specifications

  // Get accessory and swag details if available
  const accessoryDetails = product.accessoryDetails
  const swagDetails = product.swagDetails

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 flex flex-col items-center justify-center p-4 backdrop-blur-xs bg-black/50',
        className,
      )}
      style={{
        position: 'fixed',
        zIndex: 999999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="relative w-full max-w-7xl min-h-[688px] lg:min-w-[1000px] p-4 bg-black text-white rounded-lg"
        style={{
          position: 'relative',
          zIndex: 1000000,
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 md:-right-0 md:-top-0 bg-black text-white/70 hover:text-white rounded-full p-1 shadow-lg hover:bg-gray-900 transition-colors z-50"
        >
          <X className="h-8 w-8" />
        </button>
        {isBattery && specs && <IsBatterySpecs product={product} />}
        {isAccessory && accessoryDetails && <IsAccessorySpecs product={product} />}
        {isSwag && swagDetails && <IsSwagSpecs product={product} />}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
