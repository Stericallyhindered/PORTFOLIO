'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function VerifyEmail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        toast.error('Invalid or missing verification token')
        router.push('/dealer-login')
        return
      }

      try {
        const response = await fetch(`/api/dealers/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
          credentials: 'include', // Important: include credentials for session handling
        })

        if (!response.ok) {
          const data = await response.json()
          toast.error(data.errors?.[0]?.message || 'Failed to verify email')
          router.push('/dealer-login')
          return
        }

        setIsSuccess(true)
        toast.success('Email verified successfully')
      } catch (error) {
        console.error('Error verifying email:', error)
        toast.error('An unexpected error occurred')
        router.push('/dealer-login')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [searchParams, router])

  if (isVerifying) {
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
            Verifying Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Please wait while we verify your email address...
          </p>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
            Email Verified Successfully
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Thank you for verifying your email address. Our team will review your application and
            notify you once it&apos;s approved.
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

  return null // Router will handle redirect for failure cases
}
