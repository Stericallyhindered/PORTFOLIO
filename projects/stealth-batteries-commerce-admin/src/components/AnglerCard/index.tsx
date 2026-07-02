'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React, { useState } from 'react'
import Image from 'next/image'
import type { CardPostData } from '@/components/Card'
import { Media } from '@/components/Media'
import { ChevronDown, X } from 'lucide-react'

export type AnglerCardData = CardPostData

export const AnglerCard: React.FC<{
  className?: string
  doc?: AnglerCardData
  relationTo: 'posts'
  showCategories?: boolean
}> = (props) => {
  const { className, doc, relationTo, showCategories } = props
  const { card, link } = useClickableCard({})
  const [isOpen, setIsOpen] = useState(false)

  const { slug, meta, title } = doc || {}
  const { description, image: metaImage } = meta || {}
  const href = `/${relationTo}/${slug}`

  return (
    <article className={cn('mb-8 bg-[#333]/50 rounded-lg p-4 overflow-hidden', className)}>
      <div className="flex items-center">
        <div className="flex-1 p-6">
          <h3 className="text-foreground text-xl font-bold mb-2">
            <Link href={href} className="hover:text-primary transition-colors">
              {title}
            </Link>
          </h3>
          <p className="text-gray-400 mb-4">{description}</p>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-primary hover:text-white transition-colors flex items-center gap-2"
          >
            More Details
            <ChevronDown
              className={cn('transition-transform duration-200', isOpen ? 'rotate-180' : '')}
            />
          </button>
        </div>
        <div className="w-1/3 relative">
          {metaImage && typeof metaImage !== 'string' && (
            <Media resource={metaImage} size="33vw" className="object-cover h-full" />
          )}
          {!metaImage && (
            <div className="h-full flex items-center justify-center bg-muted">No image</div>
          )}
        </div>
      </div>

      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="border-t border-gray-800 p-6 relative">
          <div className="flex items-center justify-between">
            <h4 className="text-foreground text-lg font-bold">GET YOUR LATEST STEALTH SWAG</h4>
            <div className="relative w-48 h-48">
              <Image
                src="/assets/1x/Asset 2.png"
                alt="Stealth Fish Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <p className="text-foreground mt-2">Meet the S-team and learn how to become a sponsor!</p>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute bottom-4 right-4 text-gray-400 hover:text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </article>
  )
}
