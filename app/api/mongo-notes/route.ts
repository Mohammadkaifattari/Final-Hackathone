import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Note } from "@/models/Note"

async function getUserFromSession(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return session.user.id
}

export async function GET() {
  const userId = await getUserFromSession()
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    await connectToDatabase()
    const docs = await Note.find({ userId }).sort({ updatedAt: -1 }).lean()
    const notes = docs.map((d) => ({
      id: d._id.toString(),
      title: d.title,
      content: d.content,
      userId: d.userId,
      createdAt: d.createdAt?.toISOString?.() ?? "",
      updatedAt: d.updatedAt?.toISOString?.() ?? "",
    }))
    return NextResponse.json({ ok: true, data: notes })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load notes"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const userId = await getUserFromSession()
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { title, content } = await req.json()
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ ok: false, error: "Title is required" }, { status: 400 })
    }
    await connectToDatabase()
    const doc = await Note.create({
      title: title.trim(),
      content: typeof content === "string" ? content : "",
      userId,
    })
    return NextResponse.json({
      ok: true,
      data: {
        id: doc._id.toString(),
        title: doc.title,
        content: doc.content,
        userId: doc.userId,
        createdAt: doc.createdAt?.toISOString?.() ?? "",
        updatedAt: doc.updatedAt?.toISOString?.() ?? "",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create note"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const userId = await getUserFromSession()
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { id, title, content } = await req.json()
    if (typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "Note id is required" }, { status: 400 })
    }
    await connectToDatabase()
    const doc = await Note.findOneAndUpdate(
      { _id: id, userId },
      { $set: { ...(typeof title === "string" && { title: title.trim() }), ...(typeof content === "string" && { content }), updatedAt: new Date() } },
      { new: false }
    )
    if (!doc) {
      return NextResponse.json({ ok: false, error: "Note not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update note"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const userId = await getUserFromSession()
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
    const doc = await Note.findOneAndDelete({ _id: id, userId })
    if (!doc) {
      return NextResponse.json({ ok: false, error: "Note not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete note"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
