import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // If we're on the dealer login page and have a valid dealer token, redirect to dealer dashboard
  if (request.nextUrl.pathname === '/dealer-login') {
    const token = request.cookies.get('payload-token')?.value
    if (token) {
      try {
        const dealerResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/me`, {
          method: 'GET',
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store',
        })

        if (dealerResponse.ok) {
          const dealerData = await dealerResponse.json()
          if (dealerData.user?.verified && dealerData.user?._verified) {
            return NextResponse.redirect(new URL('/dealer/dashboard', request.url))
          }
        }
      } catch (error) {
        console.error('Middleware - Error checking dealer status on login page:', error)
      }
    }
    return response
  }

  // If we're on the sales rep login page and have a valid sales rep token, redirect to sales rep dashboard
  if (request.nextUrl.pathname === '/sales-rep-login') {
    const token = request.cookies.get('payload-token')?.value
    if (token) {
      try {
        const salesRepResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/salesReps/me`,
          {
            method: 'GET',
            headers: {
              Authorization: `JWT ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            cache: 'no-store',
          },
        )

        if (salesRepResponse.ok) {
          const salesRepData = await salesRepResponse.json()
          if (salesRepData.user?.active) {
            return NextResponse.redirect(new URL('/sales-rep/dashboard', request.url))
          }
        }
      } catch (error) {
        console.error('Middleware - Error checking sales rep status on login page:', error)
      }
    }
    return response
  }

  // Handle dealer authentication for dealer routes, but exclude login page and API routes
  if (
    request.nextUrl.pathname.startsWith('/dealer') &&
    !request.nextUrl.pathname.includes('/dealer-login') &&
    !request.nextUrl.pathname.includes('/dealer-register') &&
    !request.nextUrl.pathname.includes('/api/')
  ) {
    // Get the token from cookies
    const token = request.cookies.get('payload-token')?.value

    // If no token exists, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/dealer-login', request.url))
    }

    try {
      // First check if it's a dealer
      const dealerResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/me`, {
        method: 'GET',
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      })

      // If the dealer response is not ok, try admin check before redirecting
      if (!dealerResponse.ok) {
        const adminResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`, {
          method: 'GET',
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store',
        })

        if (adminResponse.ok) {
          const adminData = await adminResponse.json()
          if (adminData.user?.canAccessAdmin) {
            return response
          }
        }

        return NextResponse.redirect(new URL('/dealer-login', request.url))
      }

      const dealerData = await dealerResponse.json()

      // Check verification status
      const isEmailVerified = dealerData.user?._verified === true
      const isAdminVerified = dealerData.user?.verified === true
      const isFullyVerified = isEmailVerified && isAdminVerified

      // Handle verification redirects
      if (dealerData.user) {
        if (!isEmailVerified) {
          return NextResponse.redirect(new URL('/verify-email', request.url))
        }
        if (!isAdminVerified) {
          return NextResponse.redirect(
            new URL('/dealer-register/success?registered=pending', request.url),
          )
        }
        // Check for forcePasswordChange and redirect if needed
        // Only redirect if we're not already on the change password page
        if (
          dealerData.user.forcePasswordChange &&
          !request.nextUrl.pathname.includes('/dealer/change-password')
        ) {
          return NextResponse.redirect(new URL('/dealer/change-password', request.url))
        }
        if (isFullyVerified) {
          return response
        }
      }

      return NextResponse.redirect(new URL('/dealer-login', request.url))
    } catch (error) {
      console.error('Middleware - Error:', error)
      return NextResponse.redirect(new URL('/dealer-login', request.url))
    }
  }

  // Handle sales rep authentication for sales rep routes, but exclude login page and API routes
  if (
    request.nextUrl.pathname.startsWith('/sales-rep') &&
    !request.nextUrl.pathname.includes('/sales-rep-login') &&
    !request.nextUrl.pathname.includes('/api/')
  ) {
    // Get the token from cookies
    const token = request.cookies.get('payload-token')?.value

    // If no token exists, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/sales-rep-login', request.url))
    }

    try {
      // Check if it's a sales rep
      const salesRepResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/salesReps/me`,
        {
          method: 'GET',
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store',
        },
      )

      // If the sales rep response is not ok, try admin check before redirecting
      if (!salesRepResponse.ok) {
        const adminResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`, {
          method: 'GET',
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store',
        })

        if (adminResponse.ok) {
          const adminData = await adminResponse.json()
          if (adminData.user?.canAccessAdmin) {
            return response
          }
        }

        return NextResponse.redirect(new URL('/sales-rep-login', request.url))
      }

      const salesRepData = await salesRepResponse.json()

      // Check if sales rep is active
      if (salesRepData.user && salesRepData.user.active) {
        return response
      }

      return NextResponse.redirect(new URL('/sales-rep-login', request.url))
    } catch (error) {
      console.error('Middleware - Sales Rep Error:', error)
      return NextResponse.redirect(new URL('/sales-rep-login', request.url))
    }
  }

  // Handle affiliate code
  const searchParams = new URL(request.url).searchParams
  const affiliateCode = searchParams.get('ref')

  if (affiliateCode) {
    try {
      const validationResponse = await fetch(
        `${request.nextUrl.origin}/api/affiliates/validate?code=${affiliateCode}`,
      )

      if (validationResponse.ok) {
        const data = await validationResponse.json()

        // Store affiliate data in a cookie that expires in 30 days
        response.cookies.set(
          'affiliateCode',
          JSON.stringify({
            code: affiliateCode,
            customerDiscount: data.customerDiscount,
          }),
          {
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          },
        )
      }
    } catch (error) {
      console.error('Error validating affiliate code:', error)
    }
  }

  return response
}

// Configure the middleware to run on all routes except static assets
export const config = {
  matcher: [
    // Protect all dealer routes except login, register and API
    '/dealer/:path*',
    '/dealer-login',
    // Protect all sales rep routes except login and API
    '/sales-rep/:path*',
    '/sales-rep-login',
    // Keep the affiliate code handling for all routes except excluded ones
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
