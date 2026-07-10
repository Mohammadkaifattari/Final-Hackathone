import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Resend is not configured" }, { status: 500 })
  }

  try {
    const { to } = await req.json()
    if (typeof to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ ok: false, error: "A valid recipient email is required" }, { status: 400 })
    }

    const resend = new Resend(apiKey)
    // "onboarding@resend.dev" works without domain verification for testing.
    const { data, error } = await resend.emails.send({
      from: "Hackathon Skeleton <onboarding@resend.dev>",
      to,
      subject: "Test email from your hackathon skeleton",
      text: "If you can read this, Resend is wired up correctly.",
    })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: { id: data?.id } })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
