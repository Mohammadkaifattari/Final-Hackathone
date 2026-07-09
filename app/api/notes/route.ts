import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Note } from "@/models/Note"

// Resolve the logged-in user id or return null.
async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  const id = (session?.user as { id?: string } | undefined)?.id
  return id ?? null
}

// READ all notes for the current user.
export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    await connectToDatabase()
    const notes = await Note.find({ userId }).sort({ updatedAt: -1 }).lean()
    return NextResponse.json({ ok: true, data: notes })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load notes"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

// CREATE a note.
export async function POST(req: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { title, content } = await req.json()
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ ok: false, error: "Title is required" }, { status: 400 })
    }
    await connectToDatabase()
    const note = await Note.create({
      title: title.trim(),
      content: typeof content === "string" ? content : "",
      userId,
    })
    return NextResponse.json({ ok: true, data: note })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create note"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

// UPDATE a note (scoped to the owner).
export async function PUT(req: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { id, title, content } = await req.json()
    if (typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "Note id is required" }, { status: 400 })
    }
    await connectToDatabase()
    const note = await Note.findOneAndUpdate(
      { _id: id, userId },
      {
        ...(typeof title === "string" ? { title: title.trim() } : {}),
        ...(typeof content === "string" ? { content } : {}),
      },
      { new: true }
    )
    if (!note) {
      return NextResponse.json({ ok: false, error: "Note not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true, data: note })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update note"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

// DELETE a note (scoped to the owner).
export async function DELETE(req: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ ok: false, error: "Note id is required" }, { status: 400 })
    }
    await connectToDatabase()
    const deleted = await Note.findOneAndDelete({ _id: id, userId })
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Note not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete note"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
