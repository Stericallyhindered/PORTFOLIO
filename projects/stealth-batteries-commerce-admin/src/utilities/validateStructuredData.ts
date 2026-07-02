/**
 * Utility functions for validating structured data
 * Helps identify and debug Google Search Console structured data errors
 */

export interface StructuredDataValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  data?: any
}

/**
 * Validates BreadcrumbList structured data
 */
export function validateBreadcrumbList(data: any): StructuredDataValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required properties
  if (!data['@context']) {
    errors.push('Missing required @context property')
  } else if (data['@context'] !== 'https://schema.org') {
    warnings.push('@context should be https://schema.org')
  }

  if (!data['@type']) {
    errors.push('Missing required @type property')
  } else if (data['@type'] !== 'BreadcrumbList') {
    errors.push('@type must be BreadcrumbList')
  }

  if (!data.itemListElement) {
    errors.push('Missing required itemListElement property')
  } else if (!Array.isArray(data.itemListElement)) {
    errors.push('itemListElement must be an array')
  } else {
    // Validate each breadcrumb item
    data.itemListElement.forEach((item: any, index: number) => {
      if (!item['@type'] || item['@type'] !== 'ListItem') {
        errors.push(`Item ${index + 1}: Missing or invalid @type (should be ListItem)`)
      }

      if (!item.position || typeof item.position !== 'number') {
        errors.push(`Item ${index + 1}: Missing or invalid position property`)
      }

      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        errors.push(`Item ${index + 1}: Missing or empty name property`)
      }

      if (!item.item || typeof item.item !== 'string') {
        errors.push(`Item ${index + 1}: Missing or invalid item URL`)
      } else {
        // Validate URL format
        try {
          new URL(item.item)
        } catch {
          errors.push(`Item ${index + 1}: Invalid URL format in item property`)
        }

        // Check for common URL issues
        if (item.item.includes('//') && !item.item.startsWith('http')) {
          warnings.push(`Item ${index + 1}: URL contains double slashes`)
        }
      }
    })

    // Check position sequence
    const positions = data.itemListElement
      .map((item: any) => item.position)
      .sort((a: number, b: number) => a - b)
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] !== i + 1) {
        errors.push('Position values must be sequential starting from 1')
        break
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data,
  }
}

/**
 * Validates LocalBusiness microdata
 */
export function validateLocalBusiness(element: Element): StructuredDataValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Check itemScope and itemType
  if (!element.hasAttribute('itemscope')) {
    errors.push('Missing itemscope attribute')
  }

  const itemType = element.getAttribute('itemtype')
  if (!itemType) {
    errors.push('Missing itemtype attribute')
  } else if (!itemType.includes('LocalBusiness')) {
    warnings.push('itemtype should include LocalBusiness')
  }

  // Check for required properties
  const requiredProps = ['name', 'address', 'telephone']
  const foundProps: string[] = []

  const itemProps = element.querySelectorAll('[itemprop]')
  itemProps.forEach((prop) => {
    const propName = prop.getAttribute('itemprop')
    if (propName) {
      foundProps.push(propName)
    }
  })

  requiredProps.forEach((prop) => {
    if (!foundProps.includes(prop)) {
      warnings.push(`Missing recommended property: ${prop}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: {
      itemType,
      properties: foundProps,
    },
  }
}

/**
 * Validates JSON-LD syntax
 */
export function validateJsonLdSyntax(jsonString: string): StructuredDataValidation {
  const errors: string[] = []
  const warnings: string[] = []
  let data: any

  try {
    data = JSON.parse(jsonString)
  } catch (error) {
    errors.push(`Invalid JSON syntax: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { isValid: false, errors, warnings }
  }

  // Check for common issues
  if (typeof data !== 'object' || data === null) {
    errors.push('JSON-LD must be an object')
  }

  // Check for HTML entities that should be escaped
  const jsonStr = JSON.stringify(data)
  if (jsonStr.includes('<') || jsonStr.includes('>')) {
    warnings.push('JSON contains unescaped HTML characters')
  }

  // Check for extra whitespace
  const minified = JSON.stringify(data)
  if (jsonString.length > minified.length * 1.2) {
    warnings.push('JSON contains excessive whitespace - consider minifying')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data,
  }
}

/**
 * Debug helper for structured data
 */
export function debugStructuredData() {
  if (typeof window === 'undefined') return

  console.log('🔍 Debugging Structured Data...')

  // Find all JSON-LD scripts
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
  console.log(`Found ${jsonLdScripts.length} JSON-LD scripts`)

  jsonLdScripts.forEach((script, index) => {
    console.log(`\n📄 JSON-LD Script ${index + 1}:`)
    const content = script.textContent || ''

    const syntaxValidation = validateJsonLdSyntax(content)
    if (!syntaxValidation.isValid) {
      console.error('❌ Syntax Errors:', syntaxValidation.errors)
    }
    if (syntaxValidation.warnings.length > 0) {
      console.warn('⚠️ Warnings:', syntaxValidation.warnings)
    }

    if (syntaxValidation.data?.['@type'] === 'BreadcrumbList') {
      const breadcrumbValidation = validateBreadcrumbList(syntaxValidation.data)
      if (!breadcrumbValidation.isValid) {
        console.error('❌ Breadcrumb Errors:', breadcrumbValidation.errors)
      }
      if (breadcrumbValidation.warnings.length > 0) {
        console.warn('⚠️ Breadcrumb Warnings:', breadcrumbValidation.warnings)
      }
    }
  })

  // Find microdata
  const microdataElements = document.querySelectorAll('[itemscope]')
  console.log(`\nFound ${microdataElements.length} microdata elements`)

  microdataElements.forEach((element, index) => {
    console.log(`\n📄 Microdata Element ${index + 1}:`)
    const validation = validateLocalBusiness(element)
    if (!validation.isValid) {
      console.error('❌ Microdata Errors:', validation.errors)
    }
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Microdata Warnings:', validation.warnings)
    }
  })
}
