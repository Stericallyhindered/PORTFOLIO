import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function POST() {
  // Server-side sign out
  // Client should call signOut from next-auth/react
  return NextResponse.json({ success: true })
}

