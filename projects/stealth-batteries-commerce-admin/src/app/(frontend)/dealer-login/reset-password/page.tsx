'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      toast.error('Invalid or missing reset token')
      router.push('/dealer-login/forgot-password')
      return
    }
    setToken(token)
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate password requirements
      if (newPassword.length < 8) {
        toast.error('New password must be at least 8 characters long')
        setIsLoading(false)
        return
      }

      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match')
        setIsLoading(false)
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            password: newPassword,
          }),
        },
      )

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.errors?.[0]?.message || 'Failed to reset password')
        return
      }

      toast.success('Password reset successfully')
      router.push('/dealer-login')
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your new password below
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-card px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium leading-6">
                New Password
              </label>
              <div className="mt-2">
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  required
                  className="block w-full rounded-md border-0 px-1.5 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#E94E31] sm:text-sm sm:leading-6"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium leading-6">
                Confirm New Password
              </label>
              <div className="mt-2">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  className="block w-full rounded-md border-0 px-1.5 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#E94E31] sm:text-sm sm:leading-6"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>

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
  )
}
