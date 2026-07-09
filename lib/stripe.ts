import Stripe from "stripe"

// Lazily create the Stripe client so a missing key never crashes the app.
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return null
  }
  return new Stripe(key)
}
