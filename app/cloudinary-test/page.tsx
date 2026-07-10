"use client"

import Image from "next/image"
import { useState } from "react"
import type { CloudinaryUpload } from "@/types"

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""

export default function CloudinaryTestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploaded, setUploaded] = useState<CloudinaryUpload | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError("Please choose a file first")
      return
    }
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/cloudinary-upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error)
      } else {
        setUploaded(data.data)
        setMessage("Uploaded successfully")
      }
    } catch {
      setError("Network error during upload")
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!uploaded) return
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const res = await fetch("/api/cloudinary-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: uploaded.publicId }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error)
      } else {
        setUploaded(null)
        setMessage("Deleted successfully")
      }
    } catch {
      setError("Network error during delete")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Cloudinary Test (Image Upload)</h1>

      {error && <p className="text-red-600">Error: {error}</p>}
      {message && <p className="text-green-700">{message}</p>}

      <p className="text-xs text-gray-500">
        Cloud: {cloudName || "not set"}
      </p>

      <form onSubmit={handleUpload} className="border p-4 rounded flex flex-col gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button className="border px-3 py-1 rounded w-fit" disabled={busy}>
          {busy ? "Working..." : "Upload"}
        </button>
      </form>

      {uploaded && (
        <section className="border p-4 rounded flex flex-col gap-2">
          <h2 className="font-semibold">Uploaded image</h2>
          <Image
            src={uploaded.url}
            alt="Uploaded to Cloudinary"
            width={320}
            height={240}
            className="border max-w-xs h-auto"
            unoptimized={!cloudName}
          />
          <p className="text-sm break-all">URL: {uploaded.url}</p>
          <button className="border px-3 py-1 rounded w-fit" onClick={handleDelete} disabled={busy}>
            Delete
          </button>
        </section>
      )}
    </div>
  )
}
