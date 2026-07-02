import type { CollectionBeforeChangeHook } from 'payload'

const generateUniqueCode = (name: string): string => {
  // Remove spaces and special characters, convert to uppercase
  const baseName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

  // Take first 4 characters of name (or pad with 'X' if shorter)
  const namePrefix = (baseName + 'XXXX').slice(0, 4)

  // Generate 4 random alphanumeric characters
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()

  return `${namePrefix}-${randomChars}`
}

export const generateAffiliateCode: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  // Only generate code for new affiliates
  if (operation === 'create') {
    // Generate initial code
    let affiliateCode = generateUniqueCode(data.name)

    // Check if code already exists
    let codeExists = true
    let attempts = 0
    const maxAttempts = 5

    while (codeExists && attempts < maxAttempts) {
      const existing = await req.payload.find({
        collection: 'affiliates',
        where: {
          affiliateCode: {
            equals: affiliateCode,
          },
        },
      })

      if (existing.totalDocs === 0) {
        codeExists = false
      } else {
        affiliateCode = generateUniqueCode(data.name)
        attempts++
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique affiliate code. Please try again.')
    }

    return {
      ...data,
      affiliateCode,
    }
  }

  return data
}
