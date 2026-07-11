import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Role } from "./types";
import { connectDB } from "./mongodb";
import User from "@/models/User";

// Only these fields go into the JWT/session — never the passwordHash.
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        try {
          await connectDB();
          const user = await User.findByCredentials(email, password);
          if (!user) return null;
          return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role as Role,
          } as never; // NextAuth User type; role carried via cast.
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as SessionUser).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as SessionUser).id = token.id!;
        (session.user as SessionUser).role = token.role!;
      }
      return session;
    },
  },
};
