// Address validation utilities for dealer registration and profile forms
// Prevents users from entering full addresses in street address fields

// Common patterns for detecting full addresses in street address field
const FULL_ADDRESS_PATTERNS = [
  // Pattern: "123 Main St, City, ST 12345"
  /^.+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}(-\d{4})?$/,
  // Pattern: "123 Main St City ST 12345"
  /^.+\s+[A-Za-z\s]+\s+[A-Z]{2}\s+\d{5}(-\d{4})?$/,
  // Pattern: "123 Main St, City ST 12345"
  /^.+,\s*[A-Za-z\s]+\s+[A-Z]{2}\s+\d{5}(-\d{4})?$/,
  // Pattern: Contains ZIP code at end
  /\d{5}(-\d{4})?\s*$/,
  // Pattern: Contains state abbreviation followed by numbers
  /\b[A-Z]{2}\s+\d{5}/,
  // Pattern: Multiple commas (typical of full addresses)
  /^[^,]+,\s*[^,]+,\s*[^,]+/,
]

// Common city names that might appear in addresses
const COMMON_CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
  'Austin',
  'Jacksonville',
  'Fort Worth',
  'Columbus',
  'Charlotte',
  'San Francisco',
  'Indianapolis',
  'Seattle',
  'Denver',
  'Washington',
  'Boston',
  'Nashville',
  'Baltimore',
  'Las Vegas',
  'Portland',
  'Oklahoma City',
  'Memphis',
  'Louisville',
  'Milwaukee',
  'Tucson',
  'Fresno',
  'Sacramento',
  'Atlanta',
  'Kansas City',
  'Colorado Springs',
  'Miami',
  'Raleigh',
  'Virginia Beach',
  'Omaha',
  'Oakland',
  'Minneapolis',
  'Tulsa',
  'Arlington',
  'Tampa',
  'New Orleans',
  'Wichita',
  'Cleveland',
  'Bakersfield',
  'Aurora',
  'Anaheim',
  'Honolulu',
  'Santa Ana',
  'Riverside',
  'Corpus Christi',
  'Lexington',
  'Stockton',
  'Henderson',
  'Saint Paul',
  'St. Louis',
  'Cincinnati',
  'Pittsburgh',
  'Greensboro',
  'Anchorage',
  'Plano',
  'Lincoln',
  'Orlando',
  'Irvine',
  'Newark',
  'Durham',
  'Chula Vista',
  'Toledo',
  'Fort Wayne',
  'St. Petersburg',
  'Laredo',
  'Jersey City',
  'Chandler',
  'Madison',
  'Lubbock',
  'Scottsdale',
  'Reno',
  'Buffalo',
  'Gilbert',
  'Glendale',
  'North Las Vegas',
  'Winston-Salem',
  'Chesapeake',
  'Norfolk',
  'Fremont',
  'Garland',
  'Irving',
  'Hialeah',
  'Richmond',
  'Boise',
  'Spokane',
  'Baton Rouge',
]

// US state abbreviations
const STATE_ABBREVIATIONS = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC',
]

export interface AddressValidationResult {
  isValid: boolean
  hasFullAddress: boolean
  suggestions?: {
    street?: string
    city?: string
    state?: string
    zip?: string
  }
  errors: string[]
  warnings: string[]
}

export interface ParsedAddress {
  street: string
  city: string
  state: string
  zip: string
}

/**
 * Validates a street address field to ensure it doesn't contain a full address
 */
export function validateStreetAddress(address: string): AddressValidationResult {
  const result: AddressValidationResult = {
    isValid: true,
    hasFullAddress: false,
    errors: [],
    warnings: [],
  }

  if (!address || address.trim().length === 0) {
    result.isValid = false
    result.errors.push('Street address is required')
    return result
  }

  const trimmedAddress = address.trim()

  // Check for full address patterns
  const hasFullAddressPattern = FULL_ADDRESS_PATTERNS.some((pattern) =>
    pattern.test(trimmedAddress),
  )

  if (hasFullAddressPattern) {
    result.isValid = false
    result.hasFullAddress = true

    // Try to parse the full address
    const parsed = parseFullAddress(trimmedAddress)
    if (parsed) {
      result.suggestions = parsed
      result.errors.push(
        'It looks like you entered a full address. Please enter only the street address (e.g., "123 Main St" or "456 Oak Ave Apt 2B").',
      )
    } else {
      result.errors.push(
        'The address appears to contain city, state, or ZIP code information. Please enter only the street address.',
      )
    }
    return result
  }

  // Additional checks for common issues
  const upperAddress = trimmedAddress.toUpperCase()

  // Check for state abbreviations
  const hasStateAbbrev = STATE_ABBREVIATIONS.some(
    (state) => upperAddress.includes(` ${state} `) || upperAddress.endsWith(` ${state}`),
  )

  if (hasStateAbbrev) {
    result.isValid = false
    result.hasFullAddress = true
    result.errors.push('Please remove the state abbreviation from the street address field.')
    return result
  }

  // Check for ZIP codes
  if (/\d{5}(-\d{4})?/.test(trimmedAddress)) {
    result.isValid = false
    result.hasFullAddress = true
    result.errors.push('Please remove the ZIP code from the street address field.')
    return result
  }

  // Check for city names (less strict, just a warning)
  const hasCommonCity = COMMON_CITIES.some((city) => upperAddress.includes(city.toUpperCase()))

  if (hasCommonCity && trimmedAddress.includes(',')) {
    result.warnings.push(
      'This address may contain city information. Please ensure only the street address is entered here.',
    )
  }

  // Check for multiple commas (typical of full addresses)
  const commaCount = (trimmedAddress.match(/,/g) || []).length
  if (commaCount >= 2) {
    result.isValid = false
    result.hasFullAddress = true
    result.errors.push(
      'Please enter only the street address. Remove city, state, and ZIP code information.',
    )
    return result
  }

  return result
}

/**
 * Attempts to parse a full address into its components
 */
function parseFullAddress(fullAddress: string): ParsedAddress | null {
  const trimmed = fullAddress.trim()

  // Pattern 1: "123 Main St, City, ST 12345"
  const pattern1 = /^(.+),\s*([A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
  let match = pattern1.exec(trimmed)
  if (match) {
    return {
      street: match[1].trim(),
      city: match[2].trim(),
      state: match[3].trim(),
      zip: match[4].trim(),
    }
  }

  // Pattern 2: "123 Main St City ST 12345" (no commas)
  const pattern2 = /^(.+?)\s+([A-Za-z\s]+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
  match = pattern2.exec(trimmed)
  if (match) {
    // This is tricky because we need to separate street from city
    // We'll assume the last 3 parts are city, state, zip
    const parts = trimmed.split(/\s+/)
    if (parts.length >= 4) {
      const zip = parts[parts.length - 1]
      const state = parts[parts.length - 2]

      // Simple approach: assume everything after the first 2-3 words is city
      // This isn't perfect but avoids complex parsing
      const streetWords = parts.slice(0, Math.max(2, parts.length - 3))
      const cityWords = parts.slice(streetWords.length, -2)

      return {
        street: streetWords.join(' '),
        city: cityWords.join(' '),
        state: state,
        zip: zip,
      }
    }
  }

  // Pattern 3: "123 Main St, City ST 12345" (one comma)
  const pattern3 = /^(.+),\s*([A-Za-z\s]+)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
  match = pattern3.exec(trimmed)
  if (match) {
    return {
      street: match[1].trim(),
      city: match[2].trim(),
      state: match[3].trim(),
      zip: match[4].trim(),
    }
  }

  return null
}

/**
 * Validates all address fields together
 */
export function validateFullAddress(address: {
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
}): AddressValidationResult {
  const result: AddressValidationResult = {
    isValid: true,
    hasFullAddress: false,
    errors: [],
    warnings: [],
  }

  // Validate street address
  const streetValidation = validateStreetAddress(address.line1)
  result.errors.push(...streetValidation.errors)
  result.warnings.push(...streetValidation.warnings)
  result.hasFullAddress = streetValidation.hasFullAddress
  result.suggestions = streetValidation.suggestions

  if (!streetValidation.isValid) {
    result.isValid = false
  }

  // Validate other required fields
  if (!address.city || address.city.trim().length === 0) {
    result.isValid = false
    result.errors.push('City is required')
  }

  if (!address.state || address.state.trim().length === 0) {
    result.isValid = false
    result.errors.push('State is required')
  }

  if (!address.zip || address.zip.trim().length === 0) {
    result.isValid = false
    result.errors.push('ZIP code is required')
  } else if (!/^\d{5}(-\d{4})?$/.test(address.zip.trim())) {
    result.isValid = false
    result.errors.push('ZIP code must be in format 12345 or 12345-6789')
  }

  return result
}

/**
 * Sanitizes a street address by removing any obvious non-street components
 */
export function sanitizeStreetAddress(address: string): string {
  let cleaned = address.trim()

  // Remove ZIP codes
  cleaned = cleaned.replace(/\s*\d{5}(-\d{4})?\s*$/, '')

  // Remove state abbreviations at the end
  cleaned = cleaned.replace(/\s*,?\s*[A-Z]{2}\s*$/, '')

  // If there are multiple commas, take only the first part
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',')
    if (parts.length > 1) {
      // Check if the first part looks like a street address
      const firstPart = parts[0].trim()
      if (firstPart.match(/^\d+\s+\w+/) || firstPart.match(/^\w+\s+\w+/)) {
        cleaned = firstPart
      }
    }
  }

  return cleaned.trim()
}
