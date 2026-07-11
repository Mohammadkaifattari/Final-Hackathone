"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight } from "lucide-react";
import type { Issue } from "@/lib/types";
import { ASSET_STATUS_STYLE, ISSUE_STATUS_STYLE, PRIORITY_STYLE } from "@/lib/status";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listItem } from "@/lib/motion";
import { timeAgo } from "@/lib/format";

export function IssueRow({ issue }: { issue: Issue }) {
  const isCritical = issue.priority === "critical";
  return (
    <motion.div variants={listItem}>
      <Link
        href={`/console/issues/${issue.id}`}
        className="group flex items-center gap-4 rounded-lg border border-transparent px-4 py-3 transition-colors hover:border-line hover:bg-surface-2"
      >
        <div className="flex w-20 shrink-0 flex-col">
          <span className="font-mono text-xs font-semibold text-foreground">{issue.issueNumber}</span>
          <span className="text-[11px] text-muted">{timeAgo(issue.createdAt)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isCritical && <AlertTriangle size={14} className="shrink-0 text-[var(--critical)]" />}
            <p className="truncate text-sm font-medium text-foreground group-hover:text-accent">{issue.title}</p>
          </div>
          <p className="truncate text-xs text-muted">
            {issue.asset.name} · <span className="font-mono">{issue.asset.assetCode}</span> · {issue.asset.location}
          </p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <StatusBadge style={PRIORITY_STYLE[issue.priority]} />
          <StatusBadge style={ISSUE_STATUS_STYLE[issue.status]} pulse={!["Resolved", "Closed"].includes(issue.status)} />
        </div>
        <ChevronRight size={18} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}

export { ASSET_STATUS_STYLE };
