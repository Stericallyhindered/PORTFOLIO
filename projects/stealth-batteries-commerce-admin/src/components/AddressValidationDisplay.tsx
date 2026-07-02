'use client'

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, AlertCircle, CheckCircle, Copy } from 'lucide-react'
import type { AddressValidationResult } from '@/lib/address-validation'

interface AddressValidationDisplayProps {
  validation: AddressValidationResult
  onApplySuggestions?: (suggestions: {
    street?: string
    city?: string
    state?: string
    zip?: string
  }) => void
}

export function AddressValidationDisplay({
  validation,
  onApplySuggestions,
}: AddressValidationDisplayProps) {
  if (validation.isValid && validation.warnings.length === 0) {
    return null
  }

  const handleApplySuggestions = () => {
    if (validation.suggestions && onApplySuggestions) {
      onApplySuggestions(validation.suggestions)
    }
  }

  return (
    <div className="space-y-2">
      {/* Error messages */}
      {validation.errors.map((error, index) => (
        <Alert key={`error-${index}`} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ))}

      {/* Warning messages */}
      {validation.warnings.map((warning, index) => (
        <Alert key={`warning-${index}`} className="border-yellow-200 bg-yellow-50 text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ))}

      {/* Suggestions for parsed address */}
      {validation.suggestions && validation.hasFullAddress && (
        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">
                We detected a full address. Here is how it should be separated:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm bg-white p-3 rounded border">
                <div>
                  <strong>Street Address:</strong> {validation.suggestions.street}
                </div>
                <div>
                  <strong>City:</strong> {validation.suggestions.city}
                </div>
                <div>
                  <strong>State:</strong> {validation.suggestions.state}
                </div>
                <div>
                  <strong>ZIP Code:</strong> {validation.suggestions.zip}
                </div>
              </div>
              {onApplySuggestions && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="mt-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Apply These Values
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* General guidance */}
      {validation.hasFullAddress && (
        <Alert className="border-gray-200 bg-white text-black">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Address Field Guidelines:</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>
                  <strong>Street Address:</strong> Only the street number and street name (e.g.,
                  &quot;123 Main St&quot; or &quot;456 Oak Ave Apt 2B&quot;)
                </li>
                <li>
                  <strong>City:</strong> The city name only (e.g., &quot;Los Angeles&quot;)
                </li>
                <li>
                  <strong>State:</strong> Two-letter state code (e.g., &quot;CA&quot;)
                </li>
                <li>
                  <strong>ZIP Code:</strong> 5-digit ZIP or ZIP+4 format (e.g., &quot;90210&quot; or
                  &quot;90210-1234&quot;)
                </li>
              </ul>
              <p className="text-xs mt-2 text-gray-600">
                This format ensures proper shipping label generation and address validation.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
