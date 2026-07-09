import mongoose, { Schema, model, models } from "mongoose"

// Simple notes model used to test MongoDB CRUD.
// Every note is scoped to the user that created it.

export interface NoteDoc {
  _id: mongoose.Types.ObjectId
  title: string
  content: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

const NoteSchema = new Schema<NoteDoc>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true }
)

export const Note = models.Note || model<NoteDoc>("Note", NoteSchema)
