"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, QrCode } from "lucide-react";
import type { Asset } from "@/lib/types";
import { ASSET_STATUS_STYLE } from "@/lib/status";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listItem } from "@/lib/motion";

export function AssetRow({ asset }: { asset: Asset }) {
  const isRetired = asset.status === "Retired";
  return (
    <motion.div variants={listItem}>
      <Link
        href={`/console/assets/${asset.id}`}
        className={`group flex items-center gap-4 rounded-lg border border-transparent px-4 py-3 transition-colors hover:border-line hover:bg-surface-2 ${
          isRetired ? "opacity-60" : ""
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted group-hover:text-accent">
          <QrCode size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground group-hover:text-accent">{asset.name}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            <span className="font-mono">{asset.assetCode}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {asset.location}
            </span>
            <span aria-hidden>·</span>
            <span>{asset.category}</span>
          </div>
        </div>
        <StatusBadge style={ASSET_STATUS_STYLE[asset.status]} />
        <ChevronRight size={18} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}
