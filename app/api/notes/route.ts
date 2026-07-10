import { NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { initializeApp, cert, getApps } from "firebase-admin/app"

// Initialize Firebase Admin (once)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

const db = getFirestore()

// Verify Firebase ID token from Authorization header
async function getUserFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.slice(7)
  try {
    const decoded = await getAuth().verifyIdToken(token)
    return decoded.uid
  } catch {
    return null
  }
}

// GET - read all notes for user
export async function GET(req: Request) {
  const userId = await getUserFromToken(req)
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const snapshot = await db
      .collection("notes")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .get()

    const notes = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() ?? "",
      updatedAt: d.data().updatedAt?.toDate?.()?.toISOString?.() ?? "",
    }))

    return NextResponse.json({ ok: true, data: notes })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load notes"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

// POST - create note
export async function POST(req: Request) {
  const userId = await getUserFromToken(req)
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { title, content } = await req.json()
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ ok: false, error: "Title is required" }, { status: 400 })
    }
    const now = new Date()
    const docRef = await db.collection("notes").add({
      title: title.trim(),
      content: typeof content === "string" ? content : "",
      userId,
      createdAt: now,
      updatedAt: now,
    })
    return NextResponse.json({
      ok: true,
      data: { id: docRef.id, title: title.trim(), content: content || "", userId },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create note"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

// PUT - update note
export async function PUT(req: Request) {
  const userId = await getUserFromToken(req)
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { id, title, content } = await req.json()
    if (typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "Note id is required" }, { status: 400 })
    }

    // Verify ownership
    const noteDoc = await db.collection("notes").doc(id).get()
    if (!noteDoc.exists || noteDoc.data()?.userId !== userId) {
      return NextResponse.json({ ok: false, error: "Note not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof title === "string") updateData.title = title.trim()
    if (typeof content === "string") updateData.content = content

    await db.collection("notes").doc(id).update(updateData)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update note"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

// DELETE - delete note
export async function DELETE(req: Request) {
  const userId = await getUserFromToken(req)
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ ok: false, error: "Note id is required" }, { status: 400 })
    }

    // Verify ownership
    const noteDoc = await db.collection("notes").doc(id).get()
    if (!noteDoc.exists || noteDoc.data()?.userId !== userId) {
      return NextResponse.json({ ok: false, error: "Note not found" }, { status: 404 })
    }

    await db.collection("notes").doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete note"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
