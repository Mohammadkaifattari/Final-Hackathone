import { NextResponse } from "next/server"
import { getCloudinary } from "@/lib/cloudinary"

export async function POST(req: Request) {
  const cloudinary = getCloudinary()
  if (!cloudinary) {
    return NextResponse.json({ ok: false, error: "Cloudinary is not configured" }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "hackathon-skeleton" }, (err, res) => {
          if (err || !res) reject(err ?? new Error("Upload failed"))
          else resolve(res as { secure_url: string; public_id: string })
        })
        .end(bytes)
    })

    return NextResponse.json({
      ok: true,
      data: { url: result.secure_url, publicId: result.public_id },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
