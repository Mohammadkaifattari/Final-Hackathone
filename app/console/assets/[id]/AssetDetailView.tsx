"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Wrench,
  CalendarClock,
  UserCircle2,
  ClipboardList,
  History,
} from "lucide-react";
import { QRCodeView } from "@/components/ui/QRCodeView";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IssueRow } from "@/components/console/IssueRow";
import { Card, CardHeader, Field, EmptyState } from "@/components/ui/primitives";
import { ASSET_STATUS_STYLE } from "@/lib/status";
import { stagger, pageFade, fadeUp } from "@/lib/motion";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Asset, Issue as IssueType, HistoryEvent } from "@/lib/types";

export function AssetDetailView({
  asset,
  issues,
  history,
  publicUrl,
}: {
  asset: Asset;
  issues: IssueType[];
  history: HistoryEvent[];
  publicUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be blocked; ignore in mock phase */
    }
  };

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto max-w-6xl space-y-6">
      <Link href="/console/assets" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Assets
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-balance">{asset.name}</h1>
            <StatusBadge style={ASSET_STATUS_STYLE[asset.status]} size="md" pulse={["Under Maintenance", "Issue Reported", "Under Inspection"].includes(asset.status)} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="font-mono">{asset.assetCode}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} /> {asset.location}
            </span>
            <span aria-hidden>·</span>
            <span>{asset.category}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* left: details */}
        <div className="space-y-6 lg:col-span-2">
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Card>
              <CardHeader title="Asset Details" />
              <dl className="grid grid-cols-2 gap-4 px-5 py-5 sm:grid-cols-3">
                <Field label="Condition" value={asset.condition} />
                <Field label="Category" value={asset.category} />
                <Field label="Asset Code" value={asset.assetCode} mono />
                <Field
                  label="Assigned Technician"
                  value={asset.assignedTechnician ? (
                    <span className="inline-flex items-center gap-1">
                      <UserCircle2 size={14} /> {asset.assignedTechnician.name}
                    </span>
                  ) : undefined}
                />
                <Field
                  label="Last Service"
                  value={<span className="inline-flex items-center gap-1"><CalendarClock size={14} /> {formatDate(asset.lastServiceDate)}</span>}
                />
                <Field
                  label="Next Service"
                  value={<span className="inline-flex items-center gap-1"><CalendarClock size={14} /> {formatDate(asset.nextServiceDate)}</span>}
                />
                <Field label="Public ID" value={asset.publicId} mono />
                <Field label="Created" value={formatDate(asset.createdAt)} />
                <Field label="Updated" value={formatDate(asset.updatedAt)} />
              </dl>
            </Card>
          </motion.div>

          {/* issues */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Card>
              <CardHeader
                title="Issues"
                subtitle={`${issues.length} reported`}
                icon={<ClipboardList size={16} />}
              />
              {issues.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No issues for this asset" description="Reports from the public page will appear here." />
                </div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" className="p-2">
                  {issues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </motion.div>
              )}
            </Card>
          </motion.div>

          {/* history timeline */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Card>
              <CardHeader title="Maintenance History" subtitle="Append-only" icon={<History size={16} />} />
              {history.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No history yet" />
                </div>
              ) : (
                <ol className="relative px-5 py-5">
                  <span className="absolute left-[26px] top-5 bottom-5 w-px bg-line" aria-hidden />
                  {history.map((h) => (
                    <li key={h.id} className="relative flex gap-4 pb-5 last:pb-0">
                      <span className="z-10 mt-1 flex h-3 w-3 shrink-0 rounded-full border-2 border-background bg-accent" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{h.action}</p>
                        <p className="text-xs text-muted">
                          {h.actor} · {formatDateTime(h.createdAt)}
                          {h.relatedIssue && (
                            <>
                              {" · "}
                              <Link href={`/console/issues/${h.relatedIssue.id}`} className="font-mono text-accent hover:underline">
                                {h.relatedIssue.issueNumber}
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </motion.div>
        </div>

        {/* right: QR + actions */}
        <div className="space-y-6">
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Card>
              <CardHeader title="QR Code" icon={<QrCode size={16} />} />
              <div className="flex flex-col items-center gap-4 px-5 py-5">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeView value={publicUrl} size={180} />
                </div>
                <p className="text-center text-xs text-muted text-pretty">
                  Encodes the public URL only. Scan to report an issue — no login required.
                </p>
                <div className="grid w-full grid-cols-2 gap-2">
                  <button
                    onClick={() => downloadPng(publicUrl, `${asset.assetCode}-qr.png`)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
                  >
                    <Download size={14} /> PNG
                  </button>
                  <button
                    onClick={() => setShowLabel((s) => !s)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
                  >
                    <Printer size={14} /> Label
                  </button>
                  <button
                    onClick={copyLink}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
                  >
                    {copied ? <Check size={14} className="text-[var(--status-ok)]" /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <Link
                    href={`/asset/${asset.publicId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
                  >
                    <ExternalLink size={14} /> Open
                  </Link>
                </div>
                <div className="w-full rounded-lg bg-surface-2 px-3 py-2">
                  <p className="break-all font-mono text-[10px] text-muted">{publicUrl}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="flex items-start gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-xs text-muted">
            <Wrench size={14} className="mt-0.5 shrink-0 text-accent" />
            <p>Editing this asset's name or location will <span className="text-foreground">not</span> change the QR — the public ID is permanent.</p>
          </div>
        </div>
      </div>

      {/* print label overlay */}
      {showLabel && <PrintLabel assetName={asset.name} assetCode={asset.assetCode} location={asset.location} publicUrl={publicUrl} onClose={() => setShowLabel(false)} />}
    </motion.div>
  );
}

function downloadPng(value: string, filename: string) {
  import("qrcode").then((QRCode) => {
    QRCode.toDataURL(value, { width: 1024, margin: 2, color: { dark: "#0a0a0a", light: "#ffffff" } })
      .then((url) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
      })
      .catch(() => {});
  });
}

function PrintLabel({
  assetName,
  assetCode,
  location,
  publicUrl,
  onClose,
}: {
  assetName: string;
  assetCode: string;
  location: string;
  publicUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Print Label Preview</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-foreground">Γ£ò</button>
        </div>
        {/* The .print-area is what the @media print rule reveals */}
        <div className="print-area rounded-lg border border-line bg-white p-5 text-black">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">MaintainIQ</p>
          <p className="mt-1 font-display text-lg font-bold leading-tight">{assetName}</p>
          <p className="font-mono text-xs text-gray-700">{assetCode}</p>
          <p className="text-xs text-gray-600">{location}</p>
          <div className="my-3 flex justify-center bg-white">
            <QRCodeView value={publicUrl} size={150} />
          </div>
          <p className="text-center text-[11px] font-medium text-gray-700">Scan to report an issue</p>
        </div>
        <div className="mt-4 flex justify-end gap-2 no-print">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-surface-2">Close</button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:bg-accent-hover">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}
