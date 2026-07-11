import { notFound } from "next/navigation";
import { getAssetByPublicId } from "@/lib/queries";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import ReportIssueClient from "./ReportIssueClient";

export default async function ReportIssuePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const asset = await getAssetByPublicId(publicId);
  if (!asset) notFound();

  return (
    <ReportIssueClient
      asset={{
        name: asset.name,
        publicId: asset.publicId,
        assetCode: asset.assetCode,
        category: asset.category,
        status: asset.status,
      }}
      uploadsEnabled={isCloudinaryConfigured()}
    />
  );
}
