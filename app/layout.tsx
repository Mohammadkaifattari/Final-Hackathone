import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { Providers } from "./providers"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Hackathon Starter Skeleton",
  description: "Plumbing test kit: env, auth, db, upload, payments, email, realtime.",
}

const navLinks = [
  { href: "/", label: "Status" },
  { href: "/auth-test", label: "Auth" },
  { href: "/mongo-test", label: "Mongo" },
  { href: "/cloudinary-test", label: "Cloudinary" },
  { href: "/stripe-test", label: "Stripe" },
  { href: "/resend-test", label: "Resend" },
  { href: "/pusher-test", label: "Pusher" },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <nav className="border-b p-3 flex flex-wrap gap-3 text-sm">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="underline">
                {link.label}
              </Link>
            ))}
          </nav>
          <main className="flex-1 p-6 max-w-3xl w-full mx-auto">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
