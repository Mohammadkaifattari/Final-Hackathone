import { NextResponse } from "next/server";
import { seedDemoData, seedUsers } from "@/lib/seed";

export async function POST() {
  try {
    await seedUsers();
    const result = await seedDemoData();
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
  return NextResponse.json({ ok: true, message: "POST to seed demo data." });
}
