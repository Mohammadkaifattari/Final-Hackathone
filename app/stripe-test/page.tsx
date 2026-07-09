"use client"

import { useState } from "react"

export default function StripeTestPage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function handleCheckout() {
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/checkout", { method: "POST" })
      const data = await res.json()
      if (!data.ok || !data.data?.url) {
        setError(data.error || "Could not start checkout")
        setBusy(false)
      } else {
        window.location.href = data.data.url
      }
    } catch {
      setError("Network error starting checkout")
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Stripe Test (Payments)</h1>

      {error && <p className="text-red-600">Error: {error}</p>}

      <section className="border p-4 rounded flex flex-col gap-2 w-fit">
        <h2 className="font-semibold">Test Item — $1</h2>
        <button className="border px-3 py-1 rounded" onClick={handleCheckout} disabled={busy}>
          {busy ? "Redirecting..." : "Buy with Stripe (test mode)"}
        </button>
      </section>

      <p className="text-sm">Use card 4242 4242 4242 4242 with any future date and CVC.</p>
    </div>
  )
}
