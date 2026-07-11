import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { NewAssetForm } from "./NewAssetForm";

// Only admin + supervisor can register assets.
export default async function NewAssetPage() {
  await requireRole(["admin", "supervisor"]);
  return <NewAssetForm />;
}
