import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Stealth Batteries is a leading manufacturer of high-quality marine batteries and accessories.',
  images: [
    {
      url: `${getServerSideURL()}/og-images/og-main.webp`,
    },
  ],
  siteName: 'Stealth Batteries',
  title: 'Stealth Batteries',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
