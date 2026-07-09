"use client"

import { useState } from "react"
import { signIn, signOut, useSession } from "next-auth/react"

export default function AuthTestPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || "Signup failed")
      } else {
        setMessage("Account created. You can now log in.")
      }
    } catch {
      setError("Network error during signup")
    } finally {
      setBusy(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    setMessage("")
    const res = await signIn("credentials", { email, password, redirect: false })
    if (res?.error) {
      setError(res.error)
    } else {
      setMessage("Logged in.")
    }
    setBusy(false)
  }

  if (status === "loading") {
    return <p>Loading session...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Auth Test (NextAuth)</h1>

      <section className="border p-4 rounded">
        <h2 className="font-semibold mb-2">Current session</h2>
        {session?.user ? (
          <div className="flex flex-col gap-2">
            <p>Signed in as: {session.user.email}</p>
            <button
              className="border px-3 py-1 rounded w-fit"
              onClick={() => signOut({ redirect: false })}
            >
              Logout
            </button>
          </div>
        ) : (
          <p>Not signed in.</p>
        )}
      </section>

      {error && <p className="text-red-600">Error: {error}</p>}
      {message && <p className="text-green-700">{message}</p>}

      <div className="grid gap-6 sm:grid-cols-2">
        <form onSubmit={handleSignup} className="border p-4 rounded flex flex-col gap-2">
          <h2 className="font-semibold">Sign up (email + password)</h2>
          <input
            className="border px-2 py-1 rounded"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border px-2 py-1 rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="border px-2 py-1 rounded"
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="border px-3 py-1 rounded" disabled={busy}>
            {busy ? "Working..." : "Create account"}
          </button>
        </form>

        <form onSubmit={handleLogin} className="border p-4 rounded flex flex-col gap-2">
          <h2 className="font-semibold">Log in (credentials)</h2>
          <input
            className="border px-2 py-1 rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="border px-2 py-1 rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="border px-3 py-1 rounded" disabled={busy}>
            {busy ? "Working..." : "Log in"}
          </button>
        </form>
      </div>

      <section className="border p-4 rounded">
        <h2 className="font-semibold mb-2">Google OAuth</h2>
        <button
          className="border px-3 py-1 rounded"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
      </section>
    </div>
  )
}
