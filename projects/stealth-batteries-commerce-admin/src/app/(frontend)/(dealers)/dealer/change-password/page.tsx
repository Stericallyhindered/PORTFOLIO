'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDealer } from '@/hooks/useDealer'
import { Button } from '@/components/ui/button'

export default function ChangePassword() {
  const router = useRouter()
  const { dealer, refreshDealer } = useDealer()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate password requirements
      if (newPassword.length < 8) {
        toast.error('New password must be at least 8 characters long')
        return
      }

      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match')
        return
      }

      // First, try to update the password directly through the collection endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/${dealer?.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            password: newPassword,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.errors?.[0]?.message || data.message || 'Failed to update password')
        return
      }

      // If successful, update the forcePasswordChange flag in the same request
      if (dealer?.forcePasswordChange) {
        const updateResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/${dealer.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              forcePasswordChange: false,
            }),
          },
        )

        if (!updateResponse.ok) {
          console.error('Failed to update forcePasswordChange flag')
        }
      }

      await refreshDealer()
      toast.success('Password updated successfully')
      router.push('/dealer/dashboard')
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Change Your Password
        </h2>
        {dealer?.forcePasswordChange && (
          <p className="mt-2 text-center text-sm text-red-600">
            You must change your password before continuing
          </p>
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-card px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium leading-6">
                Current Password
              </label>
              <div className="mt-2">
                <input
                  id="current-password"
                  name="current-password"
                  type="password"
                  required
                  className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#E94E31] sm:text-sm sm:leading-6"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
            </div>

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
                  className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#E94E31] sm:text-sm sm:leading-6"
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
                  className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#E94E31] sm:text-sm sm:leading-6"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
