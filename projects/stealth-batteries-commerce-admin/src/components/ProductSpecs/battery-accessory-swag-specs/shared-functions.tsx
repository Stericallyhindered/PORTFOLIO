import { Product } from '@/payload-types'

// Helper function to format the release date
export const formatReleaseDate = (releaseDate: string) => {
  const date = new Date(releaseDate)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Helper function to check if a product is pre-order
export const isPreOrder = (releaseDate?: string) => {
  if (!releaseDate) return false
  const date = new Date(releaseDate)
  const now = new Date()
  // Set times to midnight for accurate date comparison
  date.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return date > now
}

export interface ProductSpecsProps {
  product: Product
}
