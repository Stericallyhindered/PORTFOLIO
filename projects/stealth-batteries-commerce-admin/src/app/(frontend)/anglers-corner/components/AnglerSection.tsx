'use client'

import Image from 'next/image'
import HeaderWithLines from './HeaderWithLines'
import { useState } from 'react'
import ExpandedAnglerCard from './ExpandedAnglerCard'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { AnglerData } from '../utils/loadAnglers'

export default function AnglerSection({ angler, title }: { angler: AnglerData; title: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <div className="pb-24">
        <HeaderWithLines title={title} color={angler.color} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-start md:items-center px-4">
          <div className="lg:col-span-4 w-full max-w-[360px] lg:max-w-[400px] mx-auto">
            <div
              className="relative aspect-3/5 bg-gray-900 dark:bg-black border-3 border-gray-700 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setIsExpanded(true)}
            >
              <div className="absolute top-0 left-0 right-0 bg-gray-800 text-gray-300 px-4 py-3 z-10 text-center text-xl">
                Pro Angler
              </div>
              <Image
                src={angler.image || '/assets/anglers/angler_image_coming_soon.webp'}
                alt={`Pro Angler ${angler.name}`}
                fill
                className="object-cover object-center"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-primary text-white p-4 md:p-3 lg:p-4 text-center text-lg md:text-xl lg:text-2xl font-apotek-extended font-black">
                {angler.name}
              </div>
            </div>
          </div>
          <div className="lg:col-span-8 text-center md:text-left">
            <h3 className="text-black text-4xl md:text-5xl font-apotek-extended font-black mb-6">
              {angler.quote}
            </h3>
            <div className="space-y-4 text-gray-700">
              <div className="text-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{angler.preview}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExpandedAnglerCard
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        angler={{
          name: angler.name,
          image: angler.image,
          quote: angler.quote,
          content: angler.content,
          socialMedia: angler.socialMedia,
        }}
      />
    </>
  )
}
