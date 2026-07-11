import "server-only";
import { connectDB } from "./mongodb";
import User, { USER_ROLES } from "@/models/User";

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: (typeof USER_ROLES)[number];
}

const SEED_USERS: SeedUser[] = [
  { name: "Ayesha Khan", email: "admin@maintainiq.app", password: "admin123", role: "admin" },
  { name: "Bilal Raza", email: "tech@maintainiq.app", password: "tech123", role: "technician" },
  { name: "Sana Malik", email: "supervisor@maintainiq.app", password: "super123", role: "supervisor" },
];

/**
 * Idempotently seed the demo users. Safe to call on every boot: existing
 * users are left untouched, missing ones are created. Returns a summary.
 *
 * Called from a route handler so Vercel can trigger it; also runnable via
 * `npx tsx lib/seed.ts` locally.
 */
export async function seedUsers(): Promise<{ created: number; existing: number; skipped: number }> {
  await connectDB();
  let created = 0;
  let existing = 0;

  for (const u of SEED_USERS) {
    const found = await User.findOne({ email: u.email });
    if (found) {
      existing++;
      continue;
    }
    const doc = new User({ name: u.name, email: u.email, role: u.role });
    await doc.setPassword(u.password);
    await doc.save();
    created++;
  }

  return { created, existing, skipped: 0 };
}

// CLI entrypoint
// (guarded so it doesn't run when imported)
const isDirect = require.main === module;
if (isDirect) {
  seedUsers()
    .then((r) => {
      console.log("[seed] done:", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error("[seed] failed:", e);
      process.exit(1);
    });
}
