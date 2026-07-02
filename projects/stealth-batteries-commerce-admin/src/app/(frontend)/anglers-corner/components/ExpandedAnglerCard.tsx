'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa6'

interface ExpandedAnglerCardProps {
  isOpen: boolean
  onClose: () => void
  angler: {
    name: string
    image: string
    quote: string
    content: string
    socialMedia?: {
      instagram?: string
      facebook?: string
      youtube?: string
    }
  }
}

export default function ExpandedAnglerCard({ isOpen, onClose, angler }: ExpandedAnglerCardProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-4 backdrop-blur-xs bg-black/80"
      style={{ zIndex: 999999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="relative w-full max-w-[90vw] md:max-w-[85vw] lg:max-w-6xl bg-black text-white rounded-lg overflow-hidden"
        style={{ zIndex: 1000000 }}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 bg-black text-white/70 hover:text-white rounded-full p-1 shadow-lg hover:bg-gray-900 transition-colors z-50"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="relative aspect-4/3 md:aspect-3/4 overflow-hidden">
            <Image
              src={angler.image || '/assets/anglers/angler_image_coming_soon.webp'}
              alt={`Pro Angler ${angler.name}`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute bottom-0 left-0 right-0 bg-primary text-white p-4 text-center">
              <h2 className="text-2xl font-apotek-extended font-black">{angler.name}</h2>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 pr-12 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-3xl font-apotek-extended font-black text-primary">
                {angler.quote}
              </h3>
              <div className="prose prose-invert prose-headings:font-apotek-extended prose-headings:font-black prose-headings:text-primary prose-h1:text-2xl prose-h2:text-xl prose-p:text-gray-300 prose-p:text-base prose-li:text-gray-300 prose-strong:text-white prose-strong:font-bold max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{angler.content}</ReactMarkdown>
              </div>
            </div>

            {/* Social Media Links */}
            {angler.socialMedia && (
              <div className="pt-4 border-t border-gray-800">
                <h4 className="text-lg font-apotek-extended mb-4">Follow {angler.name}</h4>
                <div className="flex gap-4">
                  {angler.socialMedia.instagram && (
                    <a
                      href={angler.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <FaInstagram className="h-8 w-8" />
                    </a>
                  )}
                  {angler.socialMedia.facebook && (
                    <a
                      href={angler.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <FaFacebook className="h-8 w-8" />
                    </a>
                  )}
                  {angler.socialMedia.youtube && (
                    <a
                      href={angler.socialMedia.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <FaYoutube className="h-8 w-8" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
