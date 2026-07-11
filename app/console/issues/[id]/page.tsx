import { notFound } from "next/navigation";
import { getIssueById, getMaintenanceForIssue, getAssetById, getTechnicians } from "@/lib/queries";
import { IssueDetailView } from "./IssueDetailView";

export const dynamic = "force-dynamic";

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const issue = await getIssueById(id);
  if (!issue) notFound();

  const [maintenance, asset, technicians] = await Promise.all([
    getMaintenanceForIssue(id),
    getAssetById(issue.asset.id),
    getTechnicians(),
  ]);

  return (
    <IssueDetailView
      issue={issue}
      maintenance={maintenance}
      asset={asset}
      technicians={technicians as any}
    />
  );
}
