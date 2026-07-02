import type { Metadata } from 'next'

import type { Media, Page, Post, Product, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | Partial<Product>
}): Promise<Metadata> => {
  const { doc } = args || {}

  const ogImage = getImageURL(doc?.meta?.image || (doc as Partial<Product>)?.heroImage)

  let title: string

  if (doc?.meta?.title) {
    // Prioritize meta title if it exists
    title = doc.meta.title + ' | Stealth Batteries'
  } else if ('title' in doc && typeof doc.title === 'string') {
    // Fallback to product title
    title = doc.title + ' | Stealth Batteries'
  } else {
    // Default fallback
    title = 'Stealth Batteries'
  }

  const description = doc?.meta?.description || (doc as Partial<Product>)?.description || ''

  return {
    description,
    openGraph: mergeOpenGraph({
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : doc?.slug || '/',
    }),
    title,
  }
}
