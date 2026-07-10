import mongoose, { Schema, model, models } from "mongoose"

// User model used by NextAuth (credentials + Google OAuth).
// passwordHash is optional because Google users have no local password.

export interface UserDoc {
  _id: mongoose.Types.ObjectId
  email: string
  name?: string
  image?: string
  passwordHash?: string
  provider: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    image: { type: String },
    passwordHash: { type: String },
    provider: { type: String, default: "credentials" },
  },
  { timestamps: true }
)

export const User = models.User || model<UserDoc>("User", UserSchema)
