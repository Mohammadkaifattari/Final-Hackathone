import type { AssetStatus, IssueStatus, Priority } from "./types";
import { ASSET_STATUSES, ISSUE_STATUSES, PRIORITIES } from "@/lib/types";

// Note: ASSET_CONDITIONS doesn't exist in lib/types yet, let's redefine it or just not re-export if not needed.
// Wait, I will just export the ones we know from lib/types.
// ============================================================
// Centralized business rules (Section 4 of the brief).
// ONE source of truth used by every server action / route handler
// so the rules can never drift between entry points.
// ============================================================

export { ASSET_STATUSES, ISSUE_STATUSES, PRIORITIES };

/** Valid forward issue-status transitions. Anything not listed is rejected. */
export const ISSUE_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  Reported: ["Assigned", "Inspection Started"],
  Assigned: ["Inspection Started"],
  "Inspection Started": ["Maintenance In Progress", "Waiting for Parts"],
  "Maintenance In Progress": ["Waiting for Parts", "Resolved"],
  "Waiting for Parts": ["Maintenance In Progress"],
  Resolved: ["Closed", "Reopened"],
  Closed: ["Reopened"],
  Reopened: ["Assigned", "Inspection Started"],
};

export function isValidTransition(from: IssueStatus, to: IssueStatus): boolean {
  return (ISSUE_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Derive the asset status from an issue status (the auto-transition rule).
 * Returns null when the issue status shouldn't change the asset status
 * (e.g. parts waiting, closed) — caller then leaves the asset as-is.
 *
 * - Reported / Reopened   -> Issue Reported
 * - Assigned              -> Issue Reported (still waiting on triage action)
 * - Inspection Started    -> Under Inspection
 * - Maintenance In Progress / Waiting for Parts -> Under Maintenance
 * - Resolved (critical)   -> Operational (critical handling is decided at report
 *                            time; resolution returns non-critical to Operational)
 */
export function derivedAssetStatus(issueStatus: IssueStatus): AssetStatus | null {
  switch (issueStatus) {
    case "Reported":
    case "Reopened":
    case "Assigned":
      return "Issue Reported";
    case "Inspection Started":
      return "Under Inspection";
    case "Maintenance In Progress":
    case "Waiting for Parts":
      return "Under Maintenance";
    case "Resolved":
    case "Closed":
      return "Operational";
    default:
      return null;
  }
}

/** Issue statuses where the issue is considered "open" (for dashboard counts). */
export const OPEN_ISSUE_STATUSES: IssueStatus[] = [
  "Reported",
  "Assigned",
  "Inspection Started",
  "Maintenance In Progress",
  "Waiting for Parts",
  "Reopened",
];

export function isOpenIssue(s: IssueStatus): boolean {
  return OPEN_ISSUE_STATUSES.includes(s);
}

/** Issues that are read-only until reopened. */
export function isEditableStatus(s: IssueStatus): boolean {
  return s !== "Closed";
}

/**
 * When an issue is reported, decide whether the asset must be taken out of
 * service. Critical issues -> Out of Service (per Section 4).
 */
export function statusForNewIssue(priority: Priority): AssetStatus {
  return priority === "critical" ? "Out of Service" : "Issue Reported";
}

/** Role capability map — single source of truth for authz on the server. */
export type Capability =
  | "manageAssets" // create/update/delete assets
  | "assignIssues" // assign technician
  | "transitionAnyIssue" // move any issue through its workflow
  | "recordMaintenance"; // log maintenance records

const CAPABILITIES: Record<string, Capability[]> = {
  admin: ["manageAssets", "assignIssues", "transitionAnyIssue", "recordMaintenance"],
  supervisor: ["assignIssues", "transitionAnyIssue"],
  technician: ["recordMaintenance"],
};

export function can(role: string | undefined | null, capability: Capability): boolean {
  if (!role) return false;
  return (CAPABILITIES[role] ?? []).includes(capability);
}
