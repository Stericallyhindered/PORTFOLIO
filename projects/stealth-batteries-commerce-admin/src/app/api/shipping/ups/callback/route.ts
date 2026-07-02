import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  // Create response with redirect
  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SERVER_URL}/shipping`)

  // Store the authorization code in a cookie if present
  if (code) {
    response.cookies.set('ups_auth_code', code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
    })
  }

  return response
}
