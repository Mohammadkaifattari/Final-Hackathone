"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Wrench,
  Sparkles,
  Loader2,
  Check,
  X,
  AlertTriangle,
  ImagePlus,
  Send,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CATEGORIES, type Priority } from "@/lib/types";
import { mockTriage, type TriageResult } from "@/lib/mock-triage";

interface AssetInfo {
  name: string;
  publicId: string;
  assetCode: string;
  category: string;
  status: string;
}

export default function ReportIssueClient({
  asset,
  uploadsEnabled,
}: {
  asset: AssetInfo;
  uploadsEnabled: boolean;
}) {
  const router = useRouter();
  const { publicId } = asset;
  const isRetired = asset.status === "Retired";

  const [step, setStep] = useState<"complaint" | "review">("complaint");
  const [complaint, setComplaint] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");

  const [triaging, setTriaging] = useState(false);
  const [triageError, setTriageError] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(asset.category || CATEGORIES[0]);
  const [priority, setPriority] = useState<Priority>("medium");
  const [causes, setCauses] = useState<string[]>([]);
  const [checks, setChecks] = useState<string[]>([]);
  const [recurringWarning, setRecurringWarning] = useState<string | undefined>();
  const [suggestedTriage, setSuggestedTriage] = useState<TriageResult | null>(null);
  const [rejectedAI, setRejectedAI] = useState(false);

  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const runTriage = async () => {
    if (!complaint.trim()) return;
    setTriaging(true);
    setTriageError("");
    try {
      let result: TriageResult | null = null;

      try {
        const res = await fetch("/api/ai/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            complaint,
            assetPublicId: publicId,
            assetCategory: asset.category,
            assetName: asset.name,
          }),
        });
        const data = await res.json();
        if (data.ok && data.triage) {
          result = {
            title: data.triage.title,
            category: data.triage.category,
            priority: data.triage.priority,
            possibleCauses: data.triage.possibleCauses ?? [],
            initialChecks: data.triage.initialChecks ?? [],
            recurringWarning: data.triage.recurringWarning,
          };
        }
      } catch {
        // fall through to mock
      }

      if (!result) {
        result = await mockTriage({
          complaint,
          assetCategory: asset.category,
          assetName: asset.name,
        });
      }

      setSuggestedTriage(result);
      setTitle(result.title);
      setCategory(result.category);
      setPriority(result.priority);
      setCauses(result.possibleCauses);
      setChecks(result.initialChecks);
      setRecurringWarning(result.recurringWarning);
      setRejectedAI(false);
      setStep("review");
    } catch {
      setTriageError("We couldn't generate a suggestion right now. You can still fill in the details manually.");
      setSuggestedTriage(null);
      setTitle(complaint.trim().slice(0, 160));
      setCategory(asset.category || CATEGORIES[0]);
      setPriority("medium");
      setCauses([]);
      setChecks([]);
      setRecurringWarning(undefined);
      setStep("review");
    } finally {
      setTriaging(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setUploadError(data.error ?? "Upload failed.");
        return;
      }
      setEvidenceUrls((prev) => [...prev, data.url]);
    } catch {
      setUploadError("Upload failed. You can still submit without a photo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const wasEdited = () => {
    if (!suggestedTriage) return false;
    const sameCauses =
      JSON.stringify(causes.filter(Boolean)) === JSON.stringify(suggestedTriage.possibleCauses.filter(Boolean));
    const sameChecks =
      JSON.stringify(checks.filter(Boolean)) === JSON.stringify(suggestedTriage.initialChecks.filter(Boolean));
    return (
      title !== suggestedTriage.title ||
      category !== suggestedTriage.category ||
      priority !== suggestedTriage.priority ||
      !sameCauses ||
      !sameChecks
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/issue/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId,
          title: title.trim(),
          category,
          priority,
          description: complaint.trim(),
          reporterName: reporterName.trim() || undefined,
          reporterContact: reporterContact.trim() || undefined,
          evidenceUrls,
          ai: {
            suggested: !!suggestedTriage && !rejectedAI,
            edited: !rejectedAI && wasEdited(),
            rejectedAI,
            possibleCauses: causes.filter(Boolean),
            initialChecks: checks.filter(Boolean),
            recurringWarning,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSubmitError(data.error ?? "Could not submit your report. Please try again.");
        return;
      }
      router.push(`/asset/${publicId}?reported=1`);
    } catch {
      setSubmitError("Could not submit your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isRetired) {
    return (
      <CenterNotice title="Reporting disabled" description="This asset has been retired." />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-line bg-surface/40">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-fg"><Wrench size={15} strokeWidth={2.4} /></div>
            <span className="font-display text-sm font-bold">MaintainIQ</span>
          </div>
          <Link href={`/asset/${publicId}`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
            <ArrowLeft size={14} /> Back to asset
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-5">
          <p className="text-xs text-muted">Reporting an issue for</p>
          <h1 className="font-display text-xl font-bold tracking-tight">{asset.name}</h1>
          <p className="font-mono text-xs text-muted">{asset.assetCode}</p>
        </div>

        <AnimatePresence mode="wait">
          {step === "complaint" ? (
            <motion.div
              key="complaint"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <form
                onSubmit={(e) => { e.preventDefault(); runTriage(); }}
                className="space-y-4 rounded-xl border border-line bg-surface p-5"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">What's wrong?</label>
                  <p className="text-xs text-muted">Describe the issue in your own words. Our AI will help structure it.</p>
                  <textarea
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    rows={4}
                    required
                    placeholder="e.g. The projector keeps flickering and there is no HDMI signal."
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Your name</label>
                    <input value={reporterName} onChange={(e) => setReporterName(e.target.value)} placeholder="Optional" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Contact (phone/email)</label>
                    <input value={reporterContact} onChange={(e) => setReporterContact(e.target.value)} placeholder="Optional" className={inputCls} />
                  </div>
                </div>

                {triageError && <p className="text-sm text-[var(--status-report)]">{triageError}</p>}

                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <Sparkles size={13} className="text-accent" /> AI will suggest a structured ticket
                  </p>
                  <button
                    type="submit"
                    disabled={triaging || !complaint.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50"
                  >
                    {triaging ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Sparkles size={16} /> Generate Ticket</>}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.form
              key="review"
              onSubmit={submit}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {suggestedTriage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[color-mix(in_oklch,var(--accent)_30%,transparent)] bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] px-4 py-3">
                  <Sparkles size={18} className="mt-0.5 shrink-0 text-accent" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">AI-generated suggestion</p>
                    <p className="text-xs text-muted">Review and edit any field. Reject the suggestion entirely if it's off.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRejectedAI((r) => !r)}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                      rejectedAI
                        ? "border-[var(--status-down)] text-[var(--status-down)]"
                        : "border-line text-muted hover:text-foreground"
                    }`}
                  >
                    {rejectedAI ? <X size={12} /> : <Check size={12} />}
                    {rejectedAI ? "Rejected" : "Looks right"}
                  </button>
                </div>
              )}

              <div className="space-y-4 rounded-xl border border-line bg-surface p-5">
                <FieldInput label="Title" value={title} onChange={setTitle} required />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={`${inputCls} capitalize`}>
                      {(["low", "medium", "high", "critical"] as Priority[]).map((p) => (
                        <option key={p} value={p} className="capitalize">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge style={{ label: priority.charAt(0).toUpperCase() + priority.slice(1), color: priorityColor(priority) }} />
                  <span className="text-xs text-muted">Preview priority badge</span>
                </div>

                <EditableList label="Possible Causes" items={causes} onChange={setCauses} />
                <EditableList label="Initial Checks" items={checks} onChange={setChecks} />
              </div>

              {uploadsEnabled && (
                <div className="rounded-xl border border-dashed border-line bg-surface/50 p-5 text-center">
                  <ImagePlus size={20} className="mx-auto mb-1 text-muted" />
                  <p className="text-sm text-foreground">Attach a photo (optional)</p>
                  <p className="text-xs text-muted">Evidence helps technicians diagnose faster.</p>
                  <label className="mt-2 inline-block cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:bg-surface-2">
                    {uploading ? "Uploading..." : "Choose image"}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                  {uploadError && <p className="mt-2 text-xs text-[var(--status-report)]">{uploadError}</p>}
                  {evidenceUrls.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-muted">
                      {evidenceUrls.map((url, i) => (
                        <li key={i} className="flex items-center justify-center gap-2">
                          <span className="truncate max-w-[240px]">Photo {i + 1} attached</span>
                          <button type="button" onClick={() => setEvidenceUrls((prev) => prev.filter((_, idx) => idx !== i))} className="text-[var(--status-down)] hover:underline">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {submitError && <p className="text-sm text-[var(--status-report)]">{submitError}</p>}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <button type="button" onClick={() => setStep("complaint")} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-4 py-2.5 text-sm hover:bg-surface-2">
                  <ArrowLeft size={16} /> Edit complaint
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-50"
                >
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Report</>}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function priorityColor(p: Priority): string {
  switch (p) {
    case "critical": return "var(--critical)";
    case "high": return "var(--status-maint)";
    case "medium": return "var(--accent)";
    default: return "var(--status-retired)";
  }
}

const inputCls = "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

function FieldInput({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label} {required && <span className="text-[var(--status-down)]">*</span>}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={required} className={inputCls} />
    </div>
  );
}

function EditableList({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="shrink-0 rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-[var(--status-down)]"
              aria-label="Remove"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onChange([...items, ""])} className="text-xs text-accent hover:underline">
        + Add item
      </button>
    </div>
  );
}

function CenterNotice({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <AlertTriangle size={28} className="text-[var(--status-report)]" />
      <h1 className="font-display text-xl font-bold">{title}</h1>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      <Link href="/" className="text-sm text-accent hover:underline">Go home</Link>
    </div>
  );
}
