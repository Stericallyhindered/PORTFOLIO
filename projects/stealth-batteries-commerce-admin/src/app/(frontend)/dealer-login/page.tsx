'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { useDealer } from '@/hooks/useDealer'
import Image from 'next/image'

const REMEMBERED_EMAIL_KEY = 'rememberedDealerEmail'

export default function DealerLogin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { refreshDealer } = useDealer()
  const [showRegistrationToast, setShowRegistrationToast] = useState(false)

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

  useEffect(() => {
    const registered = searchParams.get('registered')
    if (registered === 'true') {
      setShowRegistrationToast(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (showRegistrationToast) {
      toast.success(
        'Registration successful! Please check your email to verify your address. Our team will review your application and notify you when your account is approved.',
      )
      setShowRegistrationToast(false)
    }
  }, [showRegistrationToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Check network connectivity first
      if (!navigator.onLine) {
        toast.error('No internet connection. Please check your network and try again.')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/login`, {
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

      // Refresh dealer state immediately after successful login
      try {
        await refreshDealer()

        toast.success('Login successful! Redirecting...')

        // Use replace instead of push to prevent back button from returning to login
        window.location.href = '/dealer/dashboard'
      } catch (refreshError) {
        console.error('Error refreshing dealer state:', refreshError)
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
            Sign in to your dealer account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/dealer-register" className="font-medium text-[#E94E31] hover:opacity-80">
              Apply for a dealer account
            </Link>
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
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link
                  href="/dealer-login/forgot-password"
                  className="font-medium text-[#E94E31] hover:text-[#d23c2a]"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded bg-[#E94E31] px-3 py-3 text-sm font-semibold text-white hover:opacity-90 focus:outline-hidden focus:ring-2 focus:ring-[#E94E31] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
