import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, CalendarClock, Gauge, ShieldCheck, Wrench, AlertTriangle, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ASSET_STATUS_STYLE } from "@/lib/status";
import { getAssetByPublicId, getHistoryForAsset } from "@/lib/queries";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }): Promise<Metadata> {
  const { publicId } = await params;
  const asset = await getAssetByPublicId(publicId);
  if (!asset) return { title: "Asset not found · MaintainIQ" };
  return { title: `${asset.name} · MaintainIQ`, description: `Asset status for ${asset.name} (${asset.assetCode}).` };
}

export default async function PublicAssetPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const asset = await getAssetByPublicId(publicId);
  if (!asset) notFound();

  const isRetired = asset.status === "Retired";
  const isDown = asset.status === "Out of Service";
  // Public-safe recent activity: only the action + date, never internal notes/costs/staff.
  const history = await getHistoryForAsset(asset.id);
  const recentActivity = history
    .slice(0, 4)
    .map((h) => ({ action: h.action, date: h.createdAt }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* top brand strip */}
      <header className="border-b border-line bg-surface/40">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-fg">
              <Wrench size={15} strokeWidth={2.4} />
            </div>
            <span className="font-display text-sm font-bold">MaintainIQ</span>
          </div>
          <span className="text-[11px] text-muted">Public Asset Status</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* status banner */}
        {isDown && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[color-mix(in_oklch,var(--status-down)_40%,transparent)] bg-[color-mix(in_oklch,var(--status-down)_12%,transparent)] px-4 py-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--status-down)]" />
            <p className="text-sm text-foreground">This asset is <strong>Out of Service</strong>. Please do not use it. Report any concerns below.</p>
          </div>
        )}

        {/* asset header */}
        <section className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge style={ASSET_STATUS_STYLE[asset.status]} size="md" pulse={["Under Maintenance", "Issue Reported", "Under Inspection"].includes(asset.status)} />
            {isRetired && <span className="text-xs text-muted">Retired — reporting disabled</span>}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-balance">{asset.name}</h1>
          <p className="mt-1 font-mono text-sm text-muted">{asset.assetCode}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={14} /> {asset.location}
          </p>
        </section>

        {/* info grid */}
        <section className="mb-6 grid grid-cols-2 gap-3">
          <InfoTile icon={<Gauge size={16} />} label="Category" value={asset.category} />
          <InfoTile icon={<ShieldCheck size={16} />} label="Condition" value={asset.condition} />
          <InfoTile icon={<CalendarClock size={16} />} label="Last Service" value={formatDate(asset.lastServiceDate)} />
          <InfoTile icon={<CalendarClock size={16} />} label="Next Service" value={formatDate(asset.nextServiceDate)} />
        </section>

        {/* recent activity (public-safe) */}
        {recentActivity.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Recent Activity</h2>
            <ul className="space-y-2.5">
              {recentActivity.map((a, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="text-foreground">{a.action}</p>
                    <p className="text-xs text-muted">{formatDateTime(a.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* report CTA */}
        <section className="rounded-xl border border-line bg-surface p-5">
          {isRetired ? (
            <div className="text-center">
              <h2 className="font-display text-lg font-semibold">This asset has been retired</h2>
              <p className="mt-1 text-sm text-muted">Reporting is disabled for retired assets.</p>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-balance">Is something wrong with this asset?</h2>
                <p className="mt-0.5 text-sm text-muted text-pretty">Report an issue — no account needed. AI helps triage your report.</p>
              </div>
              <Link
                href={`/asset/${asset.publicId}/report`}
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover sm:w-auto"
              >
                Report an Issue <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>

        <footer className="mt-8 text-center text-[11px] text-muted">
          Powered by MaintainIQ · QR Asset Maintenance Platform
        </footer>
      </main>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3.5">
      <div className="mb-1 flex items-center gap-1.5 text-muted">{icon}<span className="text-[11px] uppercase tracking-wide">{label}</span></div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
