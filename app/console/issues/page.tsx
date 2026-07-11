import { getAllIssues } from "@/lib/queries";
import { IssuesView } from "./IssuesView";

export const dynamic = "force-dynamic";

export default async function IssuesPage() {
  const issues = await getAllIssues();

  return <IssuesView issues={issues} />;
}
