import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import bcrypt from "bcryptjs";

const ROLES = ["admin", "technician", "supervisor"] as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "technician", index: true },
  },
  { timestamps: true }
);

// ---- password helpers (instance + static) ----
userSchema.method("setPassword", async function (plain: string) {
  if (!plain || plain.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  this.passwordHash = await bcrypt.hash(plain, 12);
});

userSchema.method("verifyPassword", function (plain: string) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
});

userSchema.static("findByCredentials", async function (email: string, plain: string) {
  const user = await this.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
  if (!user) return null;
  const ok = await user.verifyPassword(plain);
  return ok ? user : null;
});

// Avoid redefining the model during hot reloads.
export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  setPassword(plain: string): Promise<void>;
  verifyPassword(plain: string): Promise<boolean>;
};

export interface UserModel extends Model<UserDoc> {
  findByCredentials(email: string, plain: string): Promise<UserDoc | null>;
}

export default (mongoose.models.User as UserModel) ||
  mongoose.model<UserDoc, UserModel>("User", userSchema, "users");

export { ROLES as USER_ROLES };
