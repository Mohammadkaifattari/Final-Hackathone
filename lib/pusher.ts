import PusherServer from "pusher"
import PusherClient from "pusher-js"

// Shared channel/event names so server and client stay in sync.
export const PUSHER_CHANNEL = "test-channel"
export const PUSHER_EVENT = "test-message"

// Server-side Pusher instance (used inside API routes only).
// Returns null when env vars are missing so pages never crash.
export function getPusherServer(): PusherServer | null {
  const { PUSHER_APP_ID, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER } =
    process.env

  if (!PUSHER_APP_ID || !PUSHER_SECRET || !NEXT_PUBLIC_PUSHER_KEY || !NEXT_PUBLIC_PUSHER_CLUSTER) {
    return null
  }

  return new PusherServer({
    appId: PUSHER_APP_ID,
    key: NEXT_PUBLIC_PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
  })
}

// Client-side Pusher instance (used in "use client" components).
export function getPusherClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

  if (!key || !cluster) {
    return null
  }

  return new PusherClient(key, { cluster })
}
