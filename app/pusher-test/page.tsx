"use client"

import { useEffect, useRef, useState } from "react"
import { getPusherClient, PUSHER_CHANNEL, PUSHER_EVENT } from "@/lib/pusher"
import type { RealtimeMessage } from "@/types"

export default function PusherTestPage() {
  const [text, setText] = useState("")
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [error, setError] = useState("")
  const [connected, setConnected] = useState(false)
  const busyRef = useRef(false)

  useEffect(() => {
    const client = getPusherClient()
    if (!client) {
      setError("Pusher is not configured (missing NEXT_PUBLIC_PUSHER_KEY / CLUSTER)")
      return
    }

    const channel = client.subscribe(PUSHER_CHANNEL)
    channel.bind("pusher:subscription_succeeded", () => setConnected(true))
    channel.bind(PUSHER_EVENT, (data: RealtimeMessage) => {
      setMessages((prev) => [data, ...prev])
    })

    return () => {
      channel.unbind_all()
      client.unsubscribe(PUSHER_CHANNEL)
      client.disconnect()
    }
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (busyRef.current) return
    busyRef.current = true
    setError("")
    try {
      const res = await fetch("/api/pusher-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!data.ok) setError(data.error)
      else setText("")
    } catch {
      setError("Network error sending message")
    } finally {
      busyRef.current = false
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Pusher Test (Realtime)</h1>
      <p className="text-sm">Status: {connected ? "connected" : "connecting..."}</p>
      <p className="text-sm">Open this page in two tabs to see messages appear live.</p>

      {error && <p className="text-red-600">Error: {error}</p>}

      <form onSubmit={handleSend} className="border p-4 rounded flex gap-2">
        <input
          className="border px-2 py-1 rounded flex-1"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button className="border px-3 py-1 rounded">Send</button>
      </form>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Live messages</h2>
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {messages.map((m) => (
              <li key={m.id} className="border p-2 rounded text-sm">
                {m.text} <span className="text-xs">({new Date(m.at).toLocaleTimeString()})</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
