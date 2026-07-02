'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '../../_providers/Auth'
import { Label } from '@/components/ui/label'

type FormData = {
  email: string
  password: string
  passwordConfirm: string
}

export const CreateAccountForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const { handleSubmit, watch } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users`, {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const message = response.statusText || 'There was an error creating the account.'
        setError(message)
        return
      }

      const redirect = searchParams.get('redirect')

      const timer = setTimeout(() => {
        setLoading(true)
      }, 1000)

      try {
        await login(data)
        clearTimeout(timer)
        if (redirect) {
          router.push(redirect)
        } else {
          router.push(`/account?success=${encodeURIComponent('Account created successfully')}`)
        }
      } catch (_) {
        clearTimeout(timer)
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [login, router, searchParams],
  )

  return (
    <div className="grid gap-4">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <p>
          {`This is where new customers can signup and create a new account. To manage all users, `}
          <Link href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/users`}>
            login to the admin dashboard
          </Link>
          .
        </p>
        <Label>Email Address</Label>
        <Input name="email" required type="email" />
        <Label>Password</Label>
        <Input name="password" required type="password" />
        <Label>Confirm Password</Label>
        <Input name="passwordConfirm" required type="password" />
      </form>
      <div className="grid grid-cols-1 w-full justify-items-center gap-4">
        <Button className="w-fit" type="submit">
          Create Account
        </Button>
        <Link href={`/login${allParams}`}>
          <Button className="w-fit">
            <span>Already have an account? Login</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
