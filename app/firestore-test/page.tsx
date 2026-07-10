"use client"

import { useEffect, useState, useCallback } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import type { FirestoreNote } from "@/lib/firestore"

export default function FirestoreTestPage() {
  const router = useRouter()

  const [user, setUser] = useState<import("firebase/auth").User | null>(null)
  const [notes, setNotes] = useState<FirestoreNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (!u) router.push("/auth-test")
    })
    return () => unsub()
  }, [router])

  const loadNotes = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError("")
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      })
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
  }, [user])

  useEffect(() => {
    if (user) loadNotes()
  }, [user, loadNotes])

  async function createNote(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError("")
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    } catch {
      setError("Failed to create note")
    } finally {
      setBusy(false)
    }
  }

  function startEdit(note: FirestoreNote) {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  async function saveEdit(noteId: string) {
    if (!user) return
    setBusy(true)
    setError("")
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: noteId, title: editTitle, content: editContent }),
      })
      const data = await res.json()
      if (!data.ok) setError(data.error)
      else {
        setEditingId(null)
        await loadNotes()
      }
    } catch {
      setError("Failed to update note")
    } finally {
      setBusy(false)
    }
  }

  async function deleteNote(noteId: string) {
    if (!user) return
    setError("")
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/notes?id=${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!data.ok) setError(data.error)
      else await loadNotes()
    } catch {
      setError("Failed to delete note")
    }
  }

  if (!user) return <p>Redirecting to login...</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Firestore Test (CRUD)</h1>

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
              <li key={note.id} className="border p-3 rounded">
                {editingId === note.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      className="border px-2 py-1 rounded"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <textarea
                      className="border px-2 py-1 rounded"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        className="border px-2 py-1 rounded"
                        onClick={() => saveEdit(note.id)}
                        disabled={busy}
                      >
                        Save
                      </button>
                      <button
                        className="border px-2 py-1 rounded"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-medium">{note.title}</p>
                      <p className="text-sm">{note.content}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button className="border px-2 py-1 rounded" onClick={() => startEdit(note)}>
                        Edit
                      </button>
                      <button
                        className="border px-2 py-1 rounded"
                        onClick={() => deleteNote(note.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
