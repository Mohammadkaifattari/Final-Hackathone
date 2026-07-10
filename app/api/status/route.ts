import { NextResponse } from "next/server"
import { initializeApp, cert, getApps, App } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getStripe } from "@/lib/stripe"
import { getCloudinary } from "@/lib/cloudinary"
import { getPusherServer } from "@/lib/pusher"
import type { PingResult } from "@/types"

const ENV_VARS = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
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

let adminApp: App | null = null

function getAdminApp(): App {
  if (adminApp) return adminApp
  if (!getApps().length) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    })
  } else {
    adminApp = getApps()[0]
  }
  return adminApp
}

async function pingFirestore(): Promise<PingResult> {
  try {
    getAdminApp()
    const db = getFirestore()
    await db.listCollections()
    return { service: "Firestore", ok: true, detail: "connected" }
  } catch (err) {
    return { service: "Firestore", ok: false, detail: err instanceof Error ? err.message : "error" }
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

  const [firestore, stripe] = await Promise.all([pingFirestore(), pingStripe()])
  const checks: PingResult[] = [firestore, stripe, pingCloudinary(), pingPusher(), pingResend()]

  return NextResponse.json({ ok: true, data: { env, checks } })
}
