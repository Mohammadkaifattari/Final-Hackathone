"use client"

import { useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import type { User } from "firebase/auth"

export default function AuthTestPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) {
        await updateProfile(cred.user, { displayName: name })
      }
      setMessage("Account created and logged in.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    setMessage("")
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setMessage("Logged in.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogleLogin() {
    setBusy(true)
    setError("")
    setMessage("")
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      setMessage("Logged in with Google.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google login failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    await signOut(auth)
    setMessage("Logged out.")
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Auth Test (Firebase)</h1>

      <section className="border p-4 rounded">
        <h2 className="font-semibold mb-2">Current user</h2>
        {user ? (
          <div className="flex flex-col gap-2">
            <p>Email: {user.email}</p>
            <p>Name: {user.displayName || "(none)"}</p>
            <p>UID: {user.uid}</p>
            <button className="border px-3 py-1 rounded w-fit" onClick={handleLogout}>
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
        <button className="border px-3 py-1 rounded" onClick={handleGoogleLogin} disabled={busy}>
          Sign in with Google
        </button>
      </section>
    </div>
  )
}
