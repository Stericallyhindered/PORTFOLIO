import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Get the token from cookies
  const token = request.cookies.get('payload-token')?.value

  // Check if the path is under the affiliate directory
  if (request.nextUrl.pathname.startsWith('/affiliate')) {
    // If no token exists, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/affiliate-login', request.url))
    }

    try {
      // First check if it's an admin
      const adminResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      const adminData = await adminResponse.json()

      // If it's an admin, allow access
      if (adminResponse.ok && adminData.user?.canAccessAdmin) {
        return NextResponse.next()
      }

      // If not an admin, check if it's an affiliate
      const affiliateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/affiliates/me`,
        {
          headers: {
            Authorization: `JWT ${token}`,
          },
        },
      )

      const affiliateData = await affiliateResponse.json()

      // If no affiliate found, redirect to login
      if (!affiliateResponse.ok || !affiliateData.user) {
        return NextResponse.redirect(new URL('/affiliate-login', request.url))
      }

      // If the affiliate is not verified, redirect to pending page
      if (!affiliateData.user.verified) {
        return NextResponse.redirect(
          new URL('/affiliate-register/success?registered=pending', request.url),
        )
      }

      // If the affiliate needs to complete Stripe onboarding
      if (
        affiliateData.user.payoutInfo?.paymentMethod === 'stripe' &&
        !affiliateData.user.payoutInfo?.stripeOnboardingComplete &&
        affiliateData.user.stripeConnectURL
      ) {
        // Only redirect to onboarding if not already on an onboarding-related page
        const isOnboardingPath = request.nextUrl.pathname.includes('/onboarding/')
        if (!isOnboardingPath) {
          return NextResponse.redirect(new URL(affiliateData.user.stripeConnectURL, request.url))
        }
      }

      return NextResponse.next()
    } catch (error: unknown) {
      console.error('Error verifying token:', error)
      // If there's an error verifying the token, redirect to login
      return NextResponse.redirect(new URL('/affiliate-login', request.url))
    }
  }

  return NextResponse.next()
}

// Configure the middleware to run only on affiliate routes
export const config = {
  matcher: '/affiliate/:path*',
}
