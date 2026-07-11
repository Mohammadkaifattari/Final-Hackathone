import { getDashboardMetrics, getAllIssues, getAllAssets } from "@/lib/queries";
import { DashboardView } from "./DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrics, recentIssues, assets] = await Promise.all([
    getDashboardMetrics(),
    getAllIssues(),
    getAllAssets(),
  ]);

  // newest 5 issues + assets that need attention.
  const recent = recentIssues.slice(0, 5);
  const needsAttention = assets
    .filter((a) => a.status === "Out of Service" || a.status === "Under Maintenance")
    .slice(0, 4);

  return <DashboardView metrics={metrics} recentIssues={recent} needsAttention={needsAttention} />;
}
