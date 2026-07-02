'use client'
import Link from 'next/link'
import { CheckCircle, Clock, Mail, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function DealerRegistrationSuccess() {
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const router = useRouter()

  useEffect(() => {
    if (!registered) {
      router.push('/')
    }
  }, [registered, router])

  return (
    <>
      {registered === 'true' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Registration Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-500">
                Thank you for registering as a dealer for Stealth Batteries. Your application has
                been received.
              </p>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Next Steps:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Clock className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                    <span>
                      A member of the Stealth Batteries Team will review your application.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Mail className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                    <span>
                      You will receive an email notification once your application is approved.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <LogIn className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                    <span>
                      After approval, you&apos;ll be able to log in to your dealer account.
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/">Return to Home</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      {registered === 'pending' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500">
                Your application is currently being reviewed. You will receive an email notification
                once your application is approved.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/">Return to Home</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  )
}
