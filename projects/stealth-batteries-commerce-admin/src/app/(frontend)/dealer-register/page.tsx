'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'
import { validateFullAddress } from '@/lib/address-validation'
import { AddressValidationDisplay } from '@/components/AddressValidationDisplay'
import type { AddressValidationResult } from '@/lib/address-validation'
import { US_STATES } from '@/lib/constants/us-states'

export default function DealerRegister() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    phoneNumber: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
    },
    contactName: '',
  })

  // Validate address whenever address fields change
  const validateAddress = useCallback(() => {
    const validation = validateFullAddress(formData.address)
    setAddressValidation(validation)
    return validation
  }, [formData.address])

  // Apply suggested address values
  const handleApplySuggestions = useCallback(
    (suggestions: { street?: string; city?: string; state?: string; zip?: string }) => {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          line1: suggestions.street || prev.address.line1,
          city: suggestions.city || prev.address.city,
          state: suggestions.state || prev.address.state,
          zip: suggestions.zip || prev.address.zip,
        },
      }))
    },
    [],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate address before submission
    const validation = validateAddress()
    if (!validation.isValid) {
      setIsLoading(false)
      toast.error('Please correct the address errors before submitting')
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const json = await response.json()

      if (!response.ok) {
        toast.error(json.message || 'Registration failed')
        throw new Error(json.message || 'Registration failed')
      }

      toast.success('Registration successful! Redirecting...')
      // Redirect to success page after successful registration
      router.push('/dealer-register/success?registered=true')
    } catch (error) {
      console.error('Registration error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData((prev) => {
        const newFormData = {
          ...prev,
          address: {
            ...prev.address,
            [addressField]: value,
          },
        }
        // Validate address after updating
        setTimeout(() => {
          const validation = validateFullAddress(newFormData.address)
          setAddressValidation(validation)
        }, 100)
        return newFormData
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  return (
    <div className="flex flex-col items-center justify-center bg-background space-y-4 mt-20 mb-60">
      <Toaster position="top-right" theme="dark" closeButton richColors />
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex flex-col items-center">
          <h2 className="mt-2 text-center text-3xl font-apotek-extended tracking-tight text-foreground">
            Apply for a Dealer Account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/dealer-login" className="font-medium text-[#E94E31] hover:opacity-80">
              Sign in
            </Link>
          </p>
          <div className="mt-4 p-4 px-8 bg-gray-800 text-primary rounded-md max-w-4xl">
            <h3 className="font-semibold mb-2">Application Process:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Fill out and submit this application form</li>
              <li>Verify your email address when prompted</li>
              <li>Our team will review your application</li>
              <li>You&apos;ll receive an email when your account is approved</li>
            </ol>
          </div>
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-foreground">
                Contact Name
              </label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                autoComplete="name"
                required
                className="mt-1 block w-full rounded border-0 py-2 px-3 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                value={formData.contactName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded border-0 py-2 px-3 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full rounded border-0 py-2 px-3 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-foreground">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                className="mt-1 block w-full rounded border-0 py-2 px-3 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className="mt-1 block w-full rounded border-0 py-2 px-3 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address.line1" className="block text-sm font-medium text-foreground">
                Address Line 1
              </label>
              <input
                id="address.line1"
                name="address.line1"
                type="text"
                required
                className="mt-1 block w-full rounded border-0 py-2 px-3 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                value={formData.address.line1}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address.line2" className="block text-sm font-medium text-foreground">
                Address Line 2 (Optional)
              </label>
              <input
                id="address.line2"
                name="address.line2"
                type="text"
                className="mt-1 block w-full rounded border-0 py-2 px-3 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                value={formData.address.line2}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="address.city" className="block text-sm font-medium text-foreground">
                City
              </label>
              <input
                id="address.city"
                name="address.city"
                type="text"
                required
                className="mt-1 block w-full rounded border-0 py-2 px-3 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                value={formData.address.city}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="address.state" className="block text-sm font-medium text-foreground">
                State
              </label>
              <select
                id="address.state"
                name="address.state"
                required
                className="mt-1 block w-full rounded border-0 py-2 px-3 bg-card text-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                value={formData.address.state}
                onChange={handleChange}
              >
                <option value="">Select a state</option>
                {US_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="address.zip" className="block text-sm font-medium text-foreground">
                ZIP Code
              </label>
              <input
                id="address.zip"
                name="address.zip"
                type="text"
                required
                className="mt-1 block w-full rounded border-0 py-2 px-3 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                value={formData.address.zip}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Address Validation Display */}
          {addressValidation && (
            <div className="mt-4">
              <AddressValidationDisplay
                validation={addressValidation}
                onApplySuggestions={handleApplySuggestions}
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded bg-[#E94E31] px-3 py-3 text-sm font-semibold text-white hover:opacity-90 focus:outline-hidden focus:ring-2 focus:ring-[#E94E31] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
