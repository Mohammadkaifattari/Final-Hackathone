"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { History } from "lucide-react";
import { Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { MOCK_HISTORY } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/format";
import { pageFade, stagger, listItem } from "@/lib/motion";

export default function HistoryPage() {
  const events = [...MOCK_HISTORY].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">History</h1>
        <p className="text-sm text-muted">Append-only audit trail across all assets.</p>
      </header>

      <Card>
        <CardHeader title="Event Log" icon={<History size={16} />} />
        {events.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={<History size={28} strokeWidth={1.5} />} title="No events yet" />
          </div>
        ) : (
          <motion.ol variants={stagger} initial="hidden" animate="show" className="relative px-5 py-5">
            <span className="absolute left-[26px] top-5 bottom-5 w-px bg-line" aria-hidden />
            {events.map((h) => (
              <motion.li key={h.id} variants={listItem} className="relative flex gap-4 pb-5 last:pb-0">
                <span className="z-10 mt-1 flex h-3 w-3 shrink-0 rounded-full border-2 border-background bg-accent" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{h.action}</p>
                  <p className="text-xs text-muted">
                    {h.actor} · {formatDateTime(h.createdAt)} ·{" "}
                    <Link href={`/console/assets/${h.asset.id}`} className="text-accent hover:underline">{h.asset.name}</Link>
                    {h.relatedIssue && (
                      <> · <Link href={`/console/issues/${h.relatedIssue.id}`} className="font-mono text-accent hover:underline">{h.relatedIssue.issueNumber}</Link></>
                    )}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </Card>
    </motion.div>
  );
}
