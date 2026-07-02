import type { CollectionBeforeChangeHook } from 'payload'
import { serialize } from '@/utilities/lexical'

const MAX_EXCERPT_LENGTH = 200

export const generateExcerpt: CollectionBeforeChangeHook = ({ data, operation }) => {
  // Only run on create or update operations
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  // If an excerpt is already provided, use that
  if (data.excerpt) {
    return data
  }

  // Generate excerpt from mainContent if it exists
  if (data.mainContent) {
    const content =
      typeof data.mainContent === 'string' ? data.mainContent : serialize(data.mainContent)

    // Clean up the content and create excerpt
    const cleanContent = content
      .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
      .trim()

    // Truncate to MAX_EXCERPT_LENGTH chars and add ellipsis if needed
    const excerpt =
      cleanContent.length > MAX_EXCERPT_LENGTH
        ? `${cleanContent.substring(0, MAX_EXCERPT_LENGTH).trim()}...`
        : cleanContent

    return {
      ...data,
      excerpt,
    }
  }

  return data
}
