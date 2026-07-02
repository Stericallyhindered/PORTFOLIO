'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { useSalesRep } from '@/hooks/useSalesRep'
import Image from 'next/image'

const REMEMBERED_EMAIL_KEY = 'rememberedSalesRepEmail'

export default function SalesRepLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { refreshSalesRep } = useSalesRep()

  // Load remembered email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY)
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  // Handle remember me changes
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked)
    if (!checked) {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Check network connectivity first
      if (!navigator.onLine) {
        toast.error('No internet connection. Please check your network and try again.')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/salesReps/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      })

      let json
      try {
        json = await response.json()
      } catch (parseError) {
        toast.error('Unable to connect to the server. Please try again later.')
        return
      }

      if (!response.ok) {
        const errorMessage = json.errors?.[0]?.message || json.error || 'Login failed'
        toast.error(errorMessage)
        return
      }

      // Save email to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
      }

      // Refresh sales rep state immediately after successful login
      try {
        await refreshSalesRep()

        toast.success('Login successful! Redirecting...')

        // Use replace instead of push to prevent back button from returning to login
        window.location.href = '/sales-rep/dashboard'
      } catch (refreshError) {
        console.error('Error refreshing sales rep state:', refreshError)
        toast.error(
          'Login successful but there was an error loading your account. Please try again.',
        )
      }
    } catch (error) {
      console.error('Login error details:', error)
      // More specific error messages based on the error type
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error(
          'Unable to connect to the server. Please check your internet connection and try again.',
        )
      } else {
        toast.error('An unexpected error occurred. Please try again later.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 mt-40 mb-60">
      <Image
        src="/assets/SVG/stealth-hero-kraken.svg"
        alt="Wave background"
        fill
        className="absolute top-0 left-0 object-cover aspect-video object-top w-full h-full xl:block hidden -z-10"
      />

      <Toaster />
      <div className="w-full max-w-md space-y-6 bg-black/60 p-4 rounded-lg">
        <div className="flex flex-col items-center">
          <h2 className="mt-2 text-center text-3xl font-apotek-extended tracking-tight text-foreground">
            Sales Rep Portal
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to access your sales dashboard
          </p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6 rounded-md">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded border-0 py-3 px-4 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded border-0 py-3 px-4 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#E94E31] dark:border dark:border-gray-700"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between w-full mt-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => handleRememberMeChange(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-card text-[#E94E31] focus:ring-[#E94E31]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                  Remember me
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-[#E94E31] py-3 px-3 text-sm font-medium text-white hover:bg-[#E94E31]/80 focus:outline-none focus:ring-2 focus:ring-[#E94E31] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need help accessing your account?{' '}
            <Link href="/contact" className="font-medium text-[#E94E31] hover:opacity-80">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
