"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { PingResult } from "@/types"

interface EnvItem {
  name: string
  set: boolean
}

interface StatusData {
  env: EnvItem[]
  checks: PingResult[]
}

const testPages = [
  { href: "/auth-test", label: "Auth test (NextAuth)" },
  { href: "/mongo-test", label: "Mongo test (CRUD)" },
  { href: "/cloudinary-test", label: "Cloudinary test (upload)" },
  { href: "/stripe-test", label: "Stripe test (payments)" },
  { href: "/resend-test", label: "Resend test (email)" },
  { href: "/pusher-test", label: "Pusher test (realtime)" },
]

export default function StatusDashboard() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/status")
        const json = await res.json()
        if (!json.ok) setError(json.error || "Failed to load status")
        else setData(json.data)
      } catch {
        setError("Network error loading status")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Hackathon Starter Skeleton</h1>
        <p className="text-sm">Plumbing status dashboard. This is a test kit, not the final product.</p>
      </div>

      {error && <p className="text-red-600">Error: {error}</p>}
      {loading && <p>Running checks...</p>}

      {data && (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Live service checks</h2>
            <ul className="flex flex-col gap-1">
              {data.checks.map((c) => (
                <li key={c.service} className="border p-2 rounded flex justify-between gap-3">
                  <span>{c.service}</span>
                  <span className={c.ok ? "text-green-700" : "text-red-600"}>
                    {c.ok ? "OK" : "FAIL"} — {c.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Environment variables</h2>
            <table className="border-collapse w-full text-sm">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Variable</th>
                  <th className="border p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.env.map((v) => (
                  <tr key={v.name}>
                    <td className="border p-2 font-mono">{v.name}</td>
                    <td className={`border p-2 ${v.set ? "text-green-700" : "text-red-600"}`}>
                      {v.set ? "SET" : "MISSING"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Test pages</h2>
        <ul className="flex flex-col gap-1">
          {testPages.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="underline">
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
