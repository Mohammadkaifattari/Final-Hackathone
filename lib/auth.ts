import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"

// Build the providers array conditionally so the app never crashes
// when a given provider's env vars are missing.
function buildProviders(): NextAuthOptions["providers"] {
  const providers: NextAuthOptions["providers"] = [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        await connectToDatabase()
        const user = await User.findOne({ email: credentials.email.toLowerCase() })

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password")
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) {
          throw new Error("Invalid email or password")
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        }
      },
    }),
  ]

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    )
  }

  return providers
}

export const authOptions: NextAuthOptions = {
  providers: buildProviders(),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth-test",
  },
  callbacks: {
    // Persist Google users in MongoDB the first time they sign in.
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await connectToDatabase()
        const existing = await User.findOne({ email: user.email.toLowerCase() })
        if (!existing) {
          await User.create({
            email: user.email.toLowerCase(),
            name: user.name,
            image: user.image,
            provider: "google",
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        ;(session.user as { id?: string }).id = token.id as string
      }
      return session
    },
  },
}
