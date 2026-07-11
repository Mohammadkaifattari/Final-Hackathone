import "server-only";
import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) {
    throw new Error("Cloudinary env vars (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET) are not set.");
  }
  cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret, secure: true });
  configured = true;
}

/**
 * Upload an evidence image (Buffer from form data) to Cloudinary under a
 * folder scoped to the issue. Returns the secure URL for storage.
 */
export async function uploadEvidence(
  buffer: Buffer,
  opts: { folder?: string; publicId?: string } = {}
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();
  const folder = opts.folder ?? "maintainiq/evidence";
  const res = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Limit what we accept — images only, max ~8MB enforced at the route.
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
      },
      (err, result) => {
        if (err || !result) reject(err ?? new Error("Cloudinary upload failed."));
        else resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    upload.end(buffer);
  });
  return { url: res.secure_url, publicId: res.public_id };
}

/** True when Cloudinary credentials are configured (lets the UI degrade gracefully). */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
