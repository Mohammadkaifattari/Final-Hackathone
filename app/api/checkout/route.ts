import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"

export async function POST(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Stripe is not configured" }, { status: 500 })
  }

  try {
    const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Test Item" },
            unit_amount: 100, // $1.00 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/stripe-test/success`,
      cancel_url: `${origin}/stripe-test/cancel`,
    })

    return NextResponse.json({ ok: true, data: { url: session.url, sessionId: session.id } })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
