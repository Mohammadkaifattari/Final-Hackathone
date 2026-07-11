import { NextResponse } from "next/server";
import { seedUsers } from "@/lib/seed";

// POST /api/seed — idempotently seed demo users (admin/technician/supervisor).
// Safe to call repeatedly; existing users are left untouched.
export async function POST() {
  try {
    const result = await seedUsers();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[seed] error:", err);
    return NextResponse.json(
      { error: "Seed failed. Check MONGODB_URI and try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "POST to seed demo users." });
}
