import { NextResponse } from "next/server";
import { uploadEvidence, isCloudinaryConfigured } from "@/lib/cloudinary";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  if (!isCloudinaryConfigured()) {
    // Degrade gracefully in dev/when Cloudinary isn't set up — return a neutral
    // message so the public report flow still works (just without an attachment).
    return NextResponse.json(
      { ok: false, error: "Image uploads are not configured. You can still submit your report without a photo." },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WEBP, or GIF images are allowed." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 8MB." }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadEvidence(buffer, { folder: "maintainiq/evidence" });
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
