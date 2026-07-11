"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, ClipboardList, AlertTriangle, CircleSlash, CalendarClock, ArrowRight, Gauge } from "lucide-react";
import { StatCard } from "@/components/console/StatCard";
import { IssueRow } from "@/components/console/IssueRow";
import { AssetRow } from "@/components/console/AssetRow";
import { Card, CardHeader, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { fadeUp, stagger, pageFade } from "@/lib/motion";
import { getDashboardMetrics, MOCK_ISSUES, MOCK_ASSETS } from "@/lib/mock-data";

export default function DashboardPage() {
  const metrics = getDashboardMetrics();
  const recentIssues = [...MOCK_ISSUES]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const needsAttention = MOCK_ASSETS.filter(
    (a) => a.status === "Out of Service" || a.status === "Under Maintenance"
  ).slice(0, 4);

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">Operations Overview</h1>
        <p className="text-sm text-muted text-pretty">
          Live status across all assets and maintenance issues.
        </p>
      </header>

      {/* bento summary */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-5"
      >
        <StatCard label="Total Assets" value={metrics.totalAssets} accent="var(--accent)" icon={<Package size={20} />} />
        <StatCard label="Open Issues" value={metrics.openIssues} accent="var(--status-report)" icon={<ClipboardList size={20} />} />
        <StatCard
          label="Critical Issues"
          value={metrics.criticalIssues}
          accent="var(--critical)"
          icon={<AlertTriangle size={20} />}
          alert={metrics.criticalIssues > 0}
          hint={metrics.criticalIssues > 0 ? "Needs immediate attention" : "None"}
        />
        <StatCard label="Out of Service" value={metrics.outOfService} accent="var(--status-down)" icon={<CircleSlash size={20} />} />
        <StatCard
          label="Due for Service"
          value={metrics.dueForService}
          accent="var(--status-maint)"
          icon={<CalendarClock size={20} />}
          hint="Next 30 days"
        />
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* recent issues */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Recent Issues"
              subtitle="Newest reports first"
              action={
                <ButtonLink href="/console/issues" variant="ghost" className="px-2 py-1 text-xs">
                  View all <ArrowRight size={14} />
                </ButtonLink>
              }
            />
            {recentIssues.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No issues reported yet" description="New asset issues will show up here." />
              </div>
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show" className="p-2">
                {recentIssues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* needs attention */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader
              title="Needs Attention"
              subtitle="Out of service / under maintenance"
              action={
                <ButtonLink href="/console/assets" variant="ghost" className="px-2 py-1 text-xs">
                  All <ArrowRight size={14} />
                </ButtonLink>
              }
            />
            {needsAttention.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<Gauge size={28} strokeWidth={1.5} />} title="All systems nominal" />
              </div>
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show" className="p-2">
                {needsAttention.map((asset) => (
                  <AssetRow key={asset.id} asset={asset} />
                ))}
              </motion.div>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
