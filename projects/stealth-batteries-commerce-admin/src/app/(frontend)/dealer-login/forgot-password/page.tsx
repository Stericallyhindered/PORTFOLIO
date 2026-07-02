'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        },
      )

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.errors?.[0]?.message || 'Failed to process request')
        return
      }

      setIsSubmitted(true)
      toast.success('Password reset instructions have been sent to your email')
    } catch (error) {
      console.error('Error requesting password reset:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
            Check Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            If an account exists for {email}, you will receive password reset instructions.
          </p>
          <div className="mt-6 text-center">
            <Link
              href="/dealer-login"
              className="text-sm font-medium text-[#E94E31] hover:text-[#d23c2a]"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-card px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#E94E31] sm:text-sm sm:leading-6"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-card px-6 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/dealer-login"
                className="text-sm font-medium text-[#E94E31] hover:text-[#d23c2a]"
              >
                Return to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
