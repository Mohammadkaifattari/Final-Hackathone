"use client"

import { useState } from "react"

export default function ResendTestPage() {
  const [to, setTo] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error)
      } else {
        setMessage(`Email sent. Id: ${data.data?.id ?? "unknown"}`)
      }
    } catch {
      setError("Network error sending email")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Resend Test (Email)</h1>

      {error && <p className="text-red-600">Error: {error}</p>}
      {message && <p className="text-green-700">{message}</p>}

      <form onSubmit={handleSend} className="border p-4 rounded flex flex-col gap-2">
        <input
          className="border px-2 py-1 rounded"
          type="email"
          placeholder="Recipient email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          required
        />
        <button className="border px-3 py-1 rounded w-fit" disabled={busy}>
          {busy ? "Sending..." : "Send test email"}
        </button>
      </form>

      <p className="text-sm">
        Sends from onboarding@resend.dev. Without a verified domain, Resend only delivers to your own
        account email address.
      </p>
    </div>
  )
}
