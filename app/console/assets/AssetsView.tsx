"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Search } from "lucide-react";
import { AssetRow } from "@/components/console/AssetRow";
import { Card, EmptyState, ButtonLink } from "@/components/ui/primitives";
import { stagger, pageFade } from "@/lib/motion";
import { ASSET_STATUSES } from "@/lib/business-rules";
import type { Asset } from "@/lib/types";

export function AssetsView({ assets }: { assets: Asset[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return assets.filter((a) => {
      const matchesQuery =
        !query ||
        a.name.toLowerCase().includes(q) ||
        a.assetCode.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q);
      const matchesStatus = status === "all" || a.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [assets, query, status]);

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-balance">Assets</h1>
          <p className="text-sm text-muted">{assets.length} assets registered</p>
        </div>
        <ButtonLink href="/console/assets/new" variant="primary">
          <Plus size={16} /> Register Asset
        </ButtonLink>
      </header>

      {/* filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, code, or location..."
            className="w-full rounded-lg border border-line bg-surface px-9 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="all">All statuses</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Package size={28} strokeWidth={1.5} />}
              title={assets.length === 0 ? "No assets yet" : "No assets found"}
              description={
                assets.length === 0
                  ? "Register your first asset to generate a QR sticker and start tracking maintenance."
                  : "Try adjusting your search or filter."
              }
              action={
                assets.length === 0 ? (
                  <ButtonLink href="/console/assets/new" variant="secondary">
                    <Plus size={16} /> Register Asset
                  </ButtonLink>
                ) : undefined
              }
            />
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="p-2">
            {filtered.map((asset) => (
              <AssetRow key={asset.id} asset={asset} />
            ))}
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
