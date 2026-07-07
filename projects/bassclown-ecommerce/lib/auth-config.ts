// Import drizzle-build-patch FIRST to ensure JSON.parse is patched
import "./drizzle-build-patch"

import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { z } from "zod"
import { db, users } from "./db"
import { eq } from "drizzle-orm"
import bcrypt from 'bcryptjs'
import "./auth-types"

// ---------------------------------------------------------------------------
// Detect build-time so we can avoid touching the database while Next.js
// statically evaluates this module during `next build`.
// ---------------------------------------------------------------------------
const isBuildTime =
  (process.env.NEXT_PHASE?.includes("build") ?? false) ||
  process.env.NEXT_PHASE === "phase-export"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Skip all DB work during static build
        if (isBuildTime) {
          return null
        }

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          return null
        }

        const { email, password } = validatedFields.data

        try {
          // Check if database is available
          if (!db) {
            console.error('Database not available during authentication')
            return null
          }

          // Find user in database
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

          if (!user) {
            return null
          }

          // Verify password
          const isPasswordValid = await verifyPassword(password, user.password)
          if (!isPasswordValid) {
            return null
          }

          // Check if email is verified
          if (!user.emailVerified) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || ""
        session.user.role = token.role || ""
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
} 