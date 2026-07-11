"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Search } from "lucide-react";
import { IssueRow } from "@/components/console/IssueRow";
import { Card, EmptyState } from "@/components/ui/primitives";
import { stagger, pageFade } from "@/lib/motion";
import { ISSUE_STATUSES, PRIORITIES } from "@/lib/types";
import type { Issue } from "@/lib/types";

export function IssuesView({ issues }: { issues: Issue[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  const filtered = useMemo(() => {
    return [...issues]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((i) => {
        const matchesQuery =
          !query ||
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          i.issueNumber.toLowerCase().includes(query.toLowerCase()) ||
          i.asset.name.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === "all" || i.status === status;
        const matchesPriority = priority === "all" || i.priority === priority;
        return matchesQuery && matchesStatus && matchesPriority;
      });
  }, [query, status, priority]);

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">Issues</h1>
        <p className="text-sm text-muted">{issues.length} total · {issues.filter((i) => i.priority === "critical").length} critical</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search issues..."
            className="w-full rounded-lg border border-line bg-surface px-9 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          <option value="all">All statuses</option>
          {ISSUE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectCls}>
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={<ClipboardList size={28} strokeWidth={1.5} />} title="No issues found" description="Try adjusting your filters." />
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="p-2">
            {filtered.map((issue) => <IssueRow key={issue.id} issue={issue} />)}
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

const selectCls = "rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none capitalize";
