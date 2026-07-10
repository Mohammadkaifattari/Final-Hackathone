import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./firebase"

// Collection reference
const notesCol = collection(db, "notes")

export interface FirestoreNote {
  id: string
  title: string
  content: string
  userId: string
  createdAt?: string
  updatedAt?: string
}

// CREATE
export async function createNote(userId: string, title: string, content: string) {
  const docRef = await addDoc(notesCol, {
    title: title.trim(),
    content: content || "",
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, title: title.trim(), content: content || "", userId }
}

// READ - get all notes for a user
export async function getNotes(userId: string): Promise<FirestoreNote[]> {
  const q = query(notesCol, where("userId", "==", userId), orderBy("updatedAt", "desc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() ?? "",
    updatedAt: d.data().updatedAt?.toDate?.()?.toISOString?.() ?? "",
  })) as FirestoreNote[]
}

// UPDATE
export async function updateNote(noteId: string, data: { title?: string; content?: string }) {
  const noteRef = doc(db, "notes", noteId)
  await updateDoc(noteRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// DELETE
export async function deleteNote(noteId: string) {
  const noteRef = doc(db, "notes", noteId)
  await deleteDoc(noteRef)
}
