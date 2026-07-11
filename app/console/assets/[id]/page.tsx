import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getAssetById, getIssuesForAsset, getHistoryForAsset } from "@/lib/queries";
import { AssetDetailView } from "./AssetDetailView";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [asset, issues, history] = await Promise.all([
    getAssetById(id),
    getIssuesForAsset(id),
    getHistoryForAsset(id),
  ]);

  if (!asset) notFound();

  // Resolve the public origin for QR generation (await headers per Next 16).
  const h = await headers();
  const host = h.get("host") || "maintainiq.app";
  const proto = h.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;
  const publicUrl = `${origin}/asset/${asset.publicId}`;

  return (
    <AssetDetailView
      asset={asset}
      issues={issues}
      history={history}
      publicUrl={publicUrl}
    />
  );
}
