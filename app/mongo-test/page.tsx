"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { NoteType } from "@/types"

export default function MongoTestPage() {
  const { status } = useSession()
  const router = useRouter()

  const [notes, setNotes] = useState<NoteType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [busy, setBusy] = useState(false)

  const loadNotes = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/notes")
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || "Failed to load notes")
      } else {
        setNotes(data.data)
      }
    } catch {
      setError("Network error loading notes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth-test")
    }
    if (status === "authenticated") {
      loadNotes()
    }
  }, [status, router, loadNotes])

  async function createNote(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error)
      } else {
        setTitle("")
        setContent("")
        await loadNotes()
      }
    } finally {
      setBusy(false)
    }
  }

  async function updateNote(note: NoteType) {
    const newTitle = window.prompt("New title", note.title)
    if (newTitle === null) return
    const newContent = window.prompt("New content", note.content)
    if (newContent === null) return
    setError("")
    const res = await fetch("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note._id, title: newTitle, content: newContent }),
    })
    const data = await res.json()
    if (!data.ok) setError(data.error)
    else await loadNotes()
  }

  async function deleteNote(id: string) {
    setError("")
    const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!data.ok) setError(data.error)
    else await loadNotes()
  }

  if (status === "loading") return <p>Loading session...</p>
  if (status === "unauthenticated") return <p>Redirecting to login...</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Mongo Test (CRUD)</h1>

      {error && <p className="text-red-600">Error: {error}</p>}

      <form onSubmit={createNote} className="border p-4 rounded flex flex-col gap-2">
        <h2 className="font-semibold">Create note</h2>
        <input
          className="border px-2 py-1 rounded"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="border px-2 py-1 rounded"
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button className="border px-3 py-1 rounded w-fit" disabled={busy}>
          {busy ? "Saving..." : "Add note"}
        </button>
      </form>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Your notes</h2>
        {loading ? (
          <p>Loading notes...</p>
        ) : notes.length === 0 ? (
          <p>No notes yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notes.map((note) => (
              <li key={note._id} className="border p-3 rounded flex justify-between gap-3">
                <div>
                  <p className="font-medium">{note.title}</p>
                  <p className="text-sm">{note.content}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="border px-2 py-1 rounded" onClick={() => updateNote(note)}>
                    Edit
                  </button>
                  <button className="border px-2 py-1 rounded" onClick={() => deleteNote(note._id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
