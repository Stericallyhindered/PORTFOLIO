'use client'

import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { Media, StealthEvent } from '@/payload-types'
import { serialize } from '@/utilities/lexical'
import { motion, AnimatePresence } from 'framer-motion'

interface StealthAngleEventProps {
  event: StealthEvent
}

export default function StealthAngleEvent({ event }: StealthAngleEventProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const mainImage = event.mainImage as Media
  const secondaryImage = event.secondaryImage as Media
  const content =
    typeof event.mainContent === 'string' ? event.mainContent : serialize(event.mainContent)

  return (
    <div className="flex flex-col w-full mx-auto overflow-hidden rounded-lg">
      {/* Top Section - Orange Background with Main Event */}
      <div className="relative flex flex-col md:flex-row bg-primary">
        <div className="flex flex-col justify-center p-6 md:w-2/3 space-y-0">
          <h2 className="text-4xl md:text-4xl font-bold text-white tracking-wide italic uppercase">
            {event.title}
          </h2>
          <h3 className="text-xl md:text-2xl font-medium text-white italic capitalize">
            {event.subtitle}
          </h3>
          <p className="text-white/90 mt-2 line-clamp-3 leading-tight">{event.excerpt}</p>
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-black font-bold text-xl mt-4 w-fit group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative">{isExpanded ? 'Show Less' : 'More Details'}</span>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown className="h-6 w-6" />
            </motion.div>
          </motion.button>
        </div>
        <div className="md:w-1/2 h-64 md:h-auto relative">
          {mainImage?.url && (
            <Image
              src={mainImage.url}
              alt={event.title || ''}
              fill
              className="object-cover object-right"
            />
          )}
        </div>
      </div>

      {/* Bottom Section - Dark Background with Secondary Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="relative flex flex-col md:flex-row bg-[#2A2A2A] overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="flex flex-col justify-center md:w-3/4 md:py-16 p-6 space-y-4">
              <motion.h4
                className="text-3xl md:text-5xl font-semibold text-white tracking-wide italic uppercase"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {event.secondaryHeader}
              </motion.h4>
              <motion.h5
                className="text-xl md:text-3xl font-medium text-primary italic"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {event.secondarySubtitle}
              </motion.h5>
              <motion.div
                className="text-white/90 mt-4 prose prose-invert max-w-none"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
            <div className="md:w-1/4 flex justify-center items-center mt-6 md:mt-0 p-6 md:p-2">
              <motion.div
                className="relative w-48 h-48 md:w-60 md:h-60"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {secondaryImage?.url && (
                  <Image
                    src={secondaryImage.url}
                    alt={event.secondaryHeader || ''}
                    width={320}
                    height={320}
                    className="object-contain "
                  />
                )}
              </motion.div>
            </div>
            <motion.div
              className="absolute bottom-4 right-4 text-primary text-5xl font-bold cursor-pointer hover:text-primary/80"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => setIsExpanded(false)}
            >
              X
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
