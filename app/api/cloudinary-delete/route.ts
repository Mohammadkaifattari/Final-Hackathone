import { NextResponse } from "next/server"
import { getCloudinary } from "@/lib/cloudinary"

export async function POST(req: Request) {
  const cloudinary = getCloudinary()
  if (!cloudinary) {
    return NextResponse.json({ ok: false, error: "Cloudinary is not configured" }, { status: 500 })
  }

  try {
    const { publicId } = await req.json()
    if (typeof publicId !== "string" || !publicId) {
      return NextResponse.json({ ok: false, error: "publicId is required" }, { status: 400 })
    }

    await cloudinary.uploader.destroy(publicId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
