import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')

    // Redirect to sign in if accessing admin routes without auth
    if (isAdminRoute && !token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Redirect to home if accessing admin routes without admin role
    if (isAdminRoute && token && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Redirect authenticated admin users to admin dashboard from auth pages
    if (isAuthRoute && token && token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    // Redirect other authenticated users to home from auth pages
    if (isAuthRoute && token) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
        if (isAdminRoute) {
          return token?.role === 'ADMIN'
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
}

