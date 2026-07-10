import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getStripe } from "@/lib/stripe"
import { getCloudinary } from "@/lib/cloudinary"
import { getPusherServer } from "@/lib/pusher"
import type { PingResult } from "@/types"

const ENV_VARS = [
  "MONGODB_URI",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "RESEND_API_KEY",
  "PUSHER_APP_ID",
  "PUSHER_SECRET",
  "NEXT_PUBLIC_PUSHER_KEY",
  "NEXT_PUBLIC_PUSHER_CLUSTER",
] as const

async function pingMongoDB(): Promise<PingResult> {
  try {
    await connectToDatabase()
    return { service: "MongoDB", ok: true, detail: "connected" }
  } catch (err) {
    return { service: "MongoDB", ok: false, detail: err instanceof Error ? err.message : "error" }
  }
}

async function pingStripe(): Promise<PingResult> {
  const stripe = getStripe()
  if (!stripe) return { service: "Stripe", ok: false, detail: "STRIPE_SECRET_KEY missing" }
  try {
    await stripe.balance.retrieve()
    return { service: "Stripe", ok: true, detail: "key valid" }
  } catch (err) {
    return { service: "Stripe", ok: false, detail: err instanceof Error ? err.message : "error" }
  }
}

function pingCloudinary(): PingResult {
  const cloudinary = getCloudinary()
  return {
    service: "Cloudinary",
    ok: Boolean(cloudinary),
    detail: cloudinary ? "configured" : "credentials missing",
  }
}

function pingPusher(): PingResult {
  const pusher = getPusherServer()
  return {
    service: "Pusher",
    ok: Boolean(pusher),
    detail: pusher ? "configured" : "credentials missing",
  }
}

function pingResend(): PingResult {
  const ok = Boolean(process.env.RESEND_API_KEY)
  return { service: "Resend", ok, detail: ok ? "configured" : "RESEND_API_KEY missing" }
}

export async function GET() {
  const env = ENV_VARS.map((name) => ({
    name,
    set: Boolean(process.env[name]),
  }))

  const [mongodb, stripe] = await Promise.all([pingMongoDB(), pingStripe()])
  const checks: PingResult[] = [mongodb, stripe, pingCloudinary(), pingPusher(), pingResend()]

  return NextResponse.json({ ok: true, data: { env, checks } })
}
