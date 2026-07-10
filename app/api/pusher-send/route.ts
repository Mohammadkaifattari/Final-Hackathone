import { NextResponse } from "next/server"
import { getPusherServer, PUSHER_CHANNEL, PUSHER_EVENT } from "@/lib/pusher"
import type { RealtimeMessage } from "@/types"

export async function POST(req: Request) {
  const pusher = getPusherServer()
  if (!pusher) {
    return NextResponse.json({ ok: false, error: "Pusher is not configured" }, { status: 500 })
  }

  try {
    const { text } = await req.json()
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ ok: false, error: "Message text is required" }, { status: 400 })
    }

    const message: RealtimeMessage = {
      id: crypto.randomUUID(),
      text: text.trim(),
      at: new Date().toISOString(),
    }

    await pusher.trigger(PUSHER_CHANNEL, PUSHER_EVENT, message)
    return NextResponse.json({ ok: true, data: message })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Failed to send message"
    return NextResponse.json({ ok: false, error: errMsg }, { status: 500 })
  }
}
