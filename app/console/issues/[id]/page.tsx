"use client";
import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  UserPlus,
  ClipboardCheck,
  Wrench,
  Package,
  CheckCircle2,
  History,
  Lock,
  Pencil,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, Field, EmptyState } from "@/components/ui/primitives";
import { ISSUE_STATUS_STYLE, PRIORITY_STYLE } from "@/lib/status";
import { MOCK_ISSUES, MOCK_MAINTENANCE, MOCK_USERS, getAssetById } from "@/lib/mock-data";
import { ISSUE_STATUSES, type IssueStatus } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { pageFade } from "@/lib/motion";

const TECHNICIANS = MOCK_USERS.filter((u) => u.role === "technician" || u.role === "admin");

// valid forward transitions per the business rules (Section 4)
const NEXT_STATUSES: Record<IssueStatus, IssueStatus[]> = {
  Reported: ["Assigned", "Inspection Started"],
  Assigned: ["Inspection Started"],
  "Inspection Started": ["Maintenance In Progress", "Waiting for Parts"],
  "Maintenance In Progress": ["Waiting for Parts", "Resolved"],
  "Waiting for Parts": ["Maintenance In Progress"],
  Resolved: ["Closed", "Reopened"],
  Closed: ["Reopened"],
  Reopened: ["Assigned", "Inspection Started"],
};

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const issue = MOCK_ISSUES.find((i) => i.id === id);
  if (!issue) notFound();

  const asset = getAssetById(issue.asset.id);
  const maintenance = MOCK_MAINTENANCE.filter((m) => m.issue.id === issue.id);

  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [assignedTo, setAssignedTo] = useState<string>(issue.assignedTo?.id ?? "");

  const isClosed = status === "Closed";
  const isResolved = status === "Resolved";
  const needsMaintToResolve = status === "Maintenance In Progress" || status === "Inspection Started";
  const nextOptions = NEXT_STATUSES[status] ?? [];

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto max-w-6xl space-y-6">
      <Link href="/console/issues" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Issues
      </Link>

      {/* header */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-sm font-semibold text-muted">{issue.issueNumber}</span>
          <StatusBadge style={PRIORITY_STYLE[issue.priority]} />
          <StatusBadge style={ISSUE_STATUS_STYLE[status]} pulse={!["Resolved", "Closed"].includes(status)} />
          {isClosed && <span className="inline-flex items-center gap-1 text-xs text-muted"><Lock size={12} /> Read-only until reopened</span>}
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight text-balance">{issue.title}</h1>
        <p className="text-sm text-muted">
          {issue.asset.name} · <span className="font-mono">{issue.asset.assetCode}</span> · {issue.asset.location}
          {asset && (
            <> · <Link href={`/console/assets/${asset.id}`} className="text-accent hover:underline">View asset</Link></>
          )}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Description" />
            <div className="px-5 py-4">
              <p className="text-sm text-foreground text-pretty whitespace-pre-wrap">{issue.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
                <Field label="Reported by" value={issue.reporterName} />
                <Field label="Contact" value={issue.reporterContact} />
                <Field label="Reported" value={formatDateTime(issue.createdAt)} />
              </dl>
            </div>
          </Card>

          {/* AI triage card */}
          <Card>
            <CardHeader
              title="AI Triage"
              subtitle={issue.ai.edited ? "Suggestion edited by staff" : "Suggestion accepted as-is"}
              icon={<Sparkles size={16} className="text-accent" />}
              action={
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${issue.ai.suggested ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-accent" : "bg-surface-2 text-muted"}`}>
                  {issue.ai.suggested ? "AI-assisted" : "Manual"}
                </span>
              }
            />
            <div className="space-y-4 px-5 py-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Possible Causes</p>
                <ul className="space-y-1">
                  {issue.ai.possibleCauses.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Initial Checks</p>
                <ul className="space-y-1">
                  {issue.ai.initialChecks.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <ClipboardCheck size={14} className="mt-0.5 shrink-0 text-accent" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
              {issue.ai.recurringWarning && (
                <div className="flex items-start gap-2 rounded-lg border border-[color-mix(in_oklch,var(--status-report)_30%,transparent)] bg-[color-mix(in_oklch,var(--status-report)_10%,transparent)] px-3 py-2">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--status-report)]" />
                  <p className="text-xs text-foreground">{issue.ai.recurringWarning}</p>
                </div>
              )}
            </div>
          </Card>

          {/* maintenance records */}
          <Card>
            <CardHeader title="Maintenance Records" subtitle={`${maintenance.length} record(s)`} icon={<Wrench size={16} />} />
            {maintenance.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<Wrench size={26} strokeWidth={1.5} />}
                  title="No maintenance recorded yet"
                  description="An issue cannot be resolved without an attached maintenance note."
                />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {maintenance.map((m) => (
                  <li key={m.id} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{m.technician.name}</p>
                      <span className="text-xs text-muted">{formatDateTime(m.completedAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground"><span className="text-muted">Findings: </span>{m.findings}</p>
                    <p className="mt-1 text-sm text-foreground"><span className="text-muted">Work performed: </span>{m.workPerformed}</p>
                    {m.parts.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted">Parts used:</p>
                        <ul className="mt-0.5 space-y-0.5">
                          {m.parts.map((p, i) => (
                            <li key={i} className="text-xs text-foreground">
                              · {p.name} × {p.quantity} — {formatCurrency(p.cost)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                      <span>Total cost: <span className="font-medium text-foreground">{formatCurrency(m.cost)}</span></span>
                      {m.timeSpent && <span>Time: {m.timeSpent}</span>}
                      <span>Final condition: <span className="text-foreground">{m.finalCondition}</span></span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* sidebar: workflow controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Workflow" icon={<History size={16} />} />
            <div className="space-y-4 px-5 py-4">
              {/* assignment */}
              <div className="space-y-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  <UserPlus size={13} /> Assigned Technician
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  disabled={isClosed}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
                >
                  <option value="">Unassigned</option>
                  {TECHNICIANS.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.role})</option>)}
                </select>
              </div>

              {/* status transition */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">Status</label>
                <div className="rounded-lg border border-line bg-background px-3 py-2 text-sm font-medium text-foreground">
                  {status}
                </div>
                {isClosed ? (
                  <p className="text-[11px] text-muted">Closed issue — reopen to edit.</p>
                ) : nextOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {nextOptions.map((s) => {
                      const isResolve = s === "Resolved";
                      const blockedResolve = isResolve && maintenance.length === 0;
                      return (
                        <button
                          key={s}
                          onClick={() => setStatus(s)}
                          disabled={blockedResolve}
                          title={blockedResolve ? "Add a maintenance record first" : `Move to ${s}`}
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            isResolve
                              ? "border-[color-mix(in_oklch,var(--status-ok)_40%,transparent)] text-[var(--status-ok)] hover:bg-[color-mix(in_oklch,var(--status-ok)_12%,transparent)]"
                              : "border-line text-muted hover:text-foreground hover:bg-surface-2"
                          }`}
                        >
                          {isResolve ? <CheckCircle2 size={12} /> : <ArrowLeft size={12} className="rotate-180" />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted">No further transitions.</p>
                )}
                {needsMaintToResolve && maintenance.length === 0 && (
                  <p className="mt-1 flex items-start gap-1 text-[11px] text-[var(--status-report)]">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" /> Cannot resolve without a maintenance record.
                  </p>
                )}
              </div>

              {/* record maintenance CTA */}
              {!["Resolved", "Closed"].includes(status) && (
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover">
                  <Pencil size={14} /> Record Maintenance
                </button>
              )}

              {/* allowed full status list (reference) */}
              <details className="pt-1">
                <summary className="cursor-pointer text-[11px] text-muted hover:text-foreground">All statuses</summary>
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {ISSUE_STATUSES.map((s) => (
                    <li key={s} className={`rounded px-1.5 py-0.5 text-[10px] ${s === status ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"}`}>{s}</li>
                  ))}
                </ul>
              </details>
            </div>
          </Card>

          {issue.evidenceUrls.length > 0 && (
            <Card>
              <CardHeader title="Evidence" icon={<Package size={16} />} />
              <div className="grid grid-cols-3 gap-2 p-4">
                {issue.evidenceUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={`Evidence ${i + 1}`} className="aspect-square w-full rounded-lg border border-line object-cover" />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
