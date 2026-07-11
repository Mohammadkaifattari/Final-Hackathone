import { getAllAssets } from "@/lib/queries";
import { AssetsView } from "./AssetsView";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const assets = await getAllAssets();
  return <AssetsView assets={assets} />;
}
