"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, Field, EmptyState } from "@/components/ui/primitives";
import { ISSUE_STATUS_STYLE, PRIORITY_STYLE } from "@/lib/status";
import { ISSUE_STATUSES, type IssueStatus } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { pageFade, fadeUp, stagger } from "@/lib/motion";
import type { Issue, MaintenanceRecord as MaintenanceType, User, Asset } from "@/lib/types";
import {
  assignIssueAction,
  transitionIssueAction,
  recordMaintenanceAction,
} from "@/app/actions/issues";

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

const inputCls =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-50";

type PartRow = { name: string; quantity: number; cost: number };

export function IssueDetailView({
  issue,
  maintenance,
  asset,
  technicians,
}: {
  issue: Issue;
  maintenance: MaintenanceType[];
  asset: Asset | null;
  technicians: Pick<User, "id" | "name" | "role">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [assignedTo, setAssignedTo] = useState<string>(issue.assignedTo?.id ?? "");

  const [showMaintForm, setShowMaintForm] = useState(false);
  const [findings, setFindings] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [parts, setParts] = useState<PartRow[]>([]);
  const [cost, setCost] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [finalCondition, setFinalCondition] = useState("Good");

  useEffect(() => {
    setStatus(issue.status);
    setAssignedTo(issue.assignedTo?.id ?? "");
  }, [issue.status, issue.assignedTo?.id]);

  const isClosed = status === "Closed";
  const needsMaintToResolve = status === "Maintenance In Progress" || status === "Inspection Started";
  const nextOptions = NEXT_STATUSES[status] ?? [];

  const resetMaintForm = () => {
    setFindings("");
    setWorkPerformed("");
    setParts([]);
    setCost("");
    setTimeSpent("");
    setFinalCondition("Good");
  };

  const handleAssign = (newValue: string) => {
    setAssignedTo(newValue);
    setError(null);
    startTransition(async () => {
      const res = await assignIssueAction(issue.id, newValue);
      if (!res.ok) setError(res.error ?? "Failed");
      else router.refresh();
    });
  };

  const handleTransition = (to: IssueStatus) => {
    setError(null);
    startTransition(async () => {
      const res = await transitionIssueAction(issue.id, to);
      if (!res.ok) setError(res.error ?? "Failed");
      else router.refresh();
    });
  };

  const handleRecordMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await recordMaintenanceAction({
        issueId: issue.id,
        findings: findings.trim(),
        workPerformed: workPerformed.trim(),
        parts: parts.filter((p) => p.name.trim()),
        cost: cost ? Number(cost) : undefined,
        timeSpent: timeSpent.trim() || undefined,
        finalCondition: finalCondition.trim() || undefined,
      });
      if (!res.ok) setError(res.error ?? "Failed");
      else {
        setShowMaintForm(false);
        resetMaintForm();
        router.refresh();
      }
    });
  };

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto max-w-6xl space-y-6">
      <Link href="/console/issues" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Issues
      </Link>

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
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 lg:col-span-2">
          <motion.div variants={fadeUp}>
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
          </motion.div>

          <motion.div variants={fadeUp}>
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
          </motion.div>

          <motion.div variants={fadeUp}>
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
          </motion.div>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={fadeUp}>
          <Card>
            <CardHeader title="Workflow" icon={<History size={16} />} />
            <div className="space-y-4 px-5 py-4">
              {error && (
                <p className="rounded-lg border border-[color-mix(in_oklch,var(--status-report)_30%,transparent)] bg-[color-mix(in_oklch,var(--status-report)_10%,transparent)] px-3 py-2 text-xs text-[var(--status-report)]">
                  {error}
                </p>
              )}

              <div className="space-y-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  <UserPlus size={13} /> Assigned Technician
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => handleAssign(e.target.value)}
                  disabled={isClosed || pending}
                  className={inputCls}
                >
                  <option value="">Unassigned</option>
                  {technicians.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.role})</option>)}
                </select>
              </div>

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
                          type="button"
                          onClick={() => handleTransition(s)}
                          disabled={blockedResolve || pending}
                          title={blockedResolve ? "Add a maintenance record first" : `Move to ${s}`}
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            isResolve
                              ? "border-[color-mix(in_oklch,var(--status-ok)_40%,transparent)] text-[var(--status-ok)] hover:bg-[color-mix(in_oklch,var(--status-ok)_12%,transparent)]"
                              : "border-line text-muted hover:text-foreground hover:bg-surface-2"
                          }`}
                        >
                          {pending ? <Loader2 size={12} className="animate-spin" /> : isResolve ? <CheckCircle2 size={12} /> : <ArrowLeft size={12} className="rotate-180" />}
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

              {!["Resolved", "Closed"].includes(status) && (
                <>
                  {!showMaintForm ? (
                    <button
                      type="button"
                      onClick={() => { setShowMaintForm(true); setError(null); }}
                      disabled={pending}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-50"
                    >
                      <Pencil size={14} /> Record Maintenance
                    </button>
                  ) : (
                    <form onSubmit={handleRecordMaintenance} className="space-y-3 rounded-lg border border-line bg-background p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">New maintenance record</p>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Findings <span className="text-[var(--status-report)]">*</span></label>
                        <textarea
                          value={findings}
                          onChange={(e) => setFindings(e.target.value)}
                          required
                          rows={2}
                          disabled={pending}
                          className={inputCls}
                          placeholder="What did you find?"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Work performed <span className="text-[var(--status-report)]">*</span></label>
                        <textarea
                          value={workPerformed}
                          onChange={(e) => setWorkPerformed(e.target.value)}
                          required
                          rows={2}
                          disabled={pending}
                          className={inputCls}
                          placeholder="What work was done?"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">Parts</label>
                        {parts.map((p, i) => (
                          <div key={i} className="grid grid-cols-3 gap-2">
                            <input
                              value={p.name}
                              onChange={(e) => {
                                const next = [...parts];
                                next[i] = { ...next[i], name: e.target.value };
                                setParts(next);
                              }}
                              disabled={pending}
                              placeholder="Part name"
                              className={inputCls}
                            />
                            <input
                              type="number"
                              min={1}
                              value={p.quantity}
                              onChange={(e) => {
                                const next = [...parts];
                                next[i] = { ...next[i], quantity: Number(e.target.value) || 1 };
                                setParts(next);
                              }}
                              disabled={pending}
                              placeholder="Qty"
                              className={inputCls}
                            />
                            <div className="flex gap-1">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={p.cost}
                                onChange={(e) => {
                                  const next = [...parts];
                                  next[i] = { ...next[i], cost: Number(e.target.value) || 0 };
                                  setParts(next);
                                }}
                                disabled={pending}
                                placeholder="Cost"
                                className={inputCls}
                              />
                              <button
                                type="button"
                                onClick={() => setParts(parts.filter((_, idx) => idx !== i))}
                                disabled={pending}
                                className="shrink-0 rounded-md border border-line px-2 text-xs text-muted hover:bg-surface-2"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setParts([...parts, { name: "", quantity: 1, cost: 0 }])}
                          disabled={pending}
                          className="text-xs text-accent hover:underline"
                        >
                          + Add part
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Total cost</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            disabled={pending}
                            placeholder="0.00"
                            className={inputCls}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Time spent</label>
                          <input
                            value={timeSpent}
                            onChange={(e) => setTimeSpent(e.target.value)}
                            disabled={pending}
                            placeholder="e.g. 45 minutes"
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Final condition</label>
                        <select
                          value={finalCondition}
                          onChange={(e) => setFinalCondition(e.target.value)}
                          disabled={pending}
                          className={inputCls}
                        >
                          {(["Excellent", "Good", "Fair", "Poor"] as const).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { setShowMaintForm(false); resetMaintForm(); }}
                          disabled={pending}
                          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm text-muted hover:bg-surface-2 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={pending || !findings.trim() || !workPerformed.trim()}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-50"
                        >
                          {pending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save record"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

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
          </motion.div>

          {issue.evidenceUrls.length > 0 && (
            <motion.div variants={fadeUp}>
            <Card>
              <CardHeader title="Evidence" icon={<Package size={16} />} />
              <div className="grid grid-cols-3 gap-2 p-4">
                {issue.evidenceUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={`Evidence ${i + 1}`} className="aspect-square w-full rounded-lg border border-line object-cover" />
                ))}
              </div>
            </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
