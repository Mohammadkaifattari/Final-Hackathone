// ============================================================
// Status → color + label config. ONE source of truth used by
// every badge in the app so colors stay consistent everywhere.
// Color values reference the oklch tokens defined in globals.css.
// ============================================================
import type { AssetStatus, IssueStatus, Priority } from "./types";

// tailwind-friendly inline color classes. We use inline style with
// the CSS token so Tailwind doesn't purge dynamic class names.
export interface BadgeStyle {
  label: string;
  color: string; // raw oklch / hex value for dot + bg tint
}

export const ASSET_STATUS_STYLE: Record<AssetStatus, BadgeStyle> = {
  Operational: { label: "Operational", color: "var(--status-ok)" },
  "Issue Reported": { label: "Issue Reported", color: "var(--status-report)" },
  "Under Inspection": { label: "Under Inspection", color: "var(--status-inspect)" },
  "Under Maintenance": { label: "Under Maintenance", color: "var(--status-maint)" },
  "Out of Service": { label: "Out of Service", color: "var(--status-down)" },
  Retired: { label: "Retired", color: "var(--status-retired)" },
};

export const ISSUE_STATUS_STYLE: Record<IssueStatus, BadgeStyle> = {
  Reported: { label: "Reported", color: "var(--status-report)" },
  Assigned: { label: "Assigned", color: "var(--accent)" },
  "Inspection Started": { label: "Inspection Started", color: "var(--status-inspect)" },
  "Maintenance In Progress": { label: "Maintenance In Progress", color: "var(--status-maint)" },
  "Waiting for Parts": { label: "Waiting for Parts", color: "var(--status-report)" },
  Resolved: { label: "Resolved", color: "var(--status-ok)" },
  Closed: { label: "Closed", color: "var(--status-retired)" },
  Reopened: { label: "Reopened", color: "var(--status-down)" },
};

export const PRIORITY_STYLE: Record<Priority, BadgeStyle> = {
  low: { label: "Low", color: "var(--status-retired)" },
  medium: { label: "Medium", color: "var(--accent)" },
  high: { label: "High", color: "var(--status-maint)" },
  critical: { label: "Critical", color: "var(--critical)" },
};

/** Build a subtle tinted background from a foreground color (rgba 12%). */
export function tint(color: string, alpha = 0.14) {
  // works for both var(--x) and hex by deferring to runtime style; we use color-mix.
  return `color-mix(in oklch, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}
