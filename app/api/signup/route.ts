import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ ok: false, error: "Email and password are required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    if (!emailValid) {
      return NextResponse.json({ ok: false, error: "Invalid email address" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "Password must be at least 6 characters" }, { status: 400 })
    }

    await connectToDatabase()

    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      return NextResponse.json({ ok: false, error: "An account with this email already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await User.create({
      email: normalizedEmail,
      name: typeof name === "string" ? name.trim() : undefined,
      passwordHash,
      provider: "credentials",
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
