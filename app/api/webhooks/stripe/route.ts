import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"

// Stripe requires the raw request body to verify the signature.
export async function POST(req: Request) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook is not configured" }, { status: 500 })
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing stripe-signature header" }, { status: 400 })
  }

  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    switch (event.type) {
      case "checkout.session.completed":
        console.log("[v0] Stripe checkout completed:", event.id)
        break
      default:
        console.log("[v0] Unhandled Stripe event:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
