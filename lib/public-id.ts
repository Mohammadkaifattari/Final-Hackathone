import "server-only";
import { connectDB } from "./mongodb";
import Asset from "@/models/Asset";
import { slugify } from "./format";

/**
 * Generate a stable, unique publicId for an asset.
 * Strategy: slugify the asset name, then ensure uniqueness by appending a
 * short suffix (-a1, -a2, ...) if the slug is taken. The id is generated ONCE
 * at creation and never changes — QR codes keep working forever.
 */
export async function generatePublicId(name: string, assetCode: string): Promise<string> {
  await connectDB();
  const base = slugify(`${name}-${assetCode}`).slice(0, 48) || slugify(name).slice(0, 48) || "asset";

  // Try the base slug first.
  const exists = await Asset.exists({ publicId: base });
  if (!exists) return base;

  // Otherwise find the next free suffix.
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    const taken = await Asset.exists({ publicId: candidate });
    if (!taken) return candidate;
  }
  // Extremely unlikely fallback.
  return `${base}-${Date.now().toString(36)}`;
}
