"use client";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { MOCK_MAINTENANCE } from "@/lib/mock-data";
import { pageFade } from "@/lib/motion";

export default function MaintenancePage() {
  const records = [...MOCK_MAINTENANCE].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">Maintenance</h1>
        <p className="text-sm text-muted">{records.length} completed record(s)</p>
      </header>

      <Card>
        <CardHeader title="Completed Maintenance" icon={<Wrench size={16} />} />
        {records.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={<Wrench size={28} strokeWidth={1.5} />} title="No maintenance records yet" />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {records.map((m) => (
              <li key={m.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.issue.issueNumber}</p>
                    <p className="text-xs text-muted">{m.technician.name} · {formatDateTime(m.completedAt)}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(m.cost)}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted line-clamp-2">{m.findings}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </motion.div>
  );
}
