"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import Asset from "@/models/Asset";
import Issue from "@/models/Issue";
import Counter from "@/models/Counter";
import HistoryEvent from "@/models/HistoryEvent";
import MaintenanceRecord from "@/models/MaintenanceRecord";
import { getSession } from "@/lib/session";
import {
  can,
  derivedAssetStatus,
  isValidTransition,
  isEditableStatus,
  statusForNewIssue,
} from "@/lib/business-rules";
import { formatIssueNumber } from "@/lib/format";
import type { IssueStatus, Priority } from "@/lib/types";

// ============================================================
// PUBLIC: report an issue (no login). Called from the public
// report flow + the /api/issue/report route handler.
// ============================================================
export interface ReportIssueInput {
  assetPublicId: string;
  complaint: string;
  reporterName?: string;
  reporterContact?: string;
  evidenceUrls?: string[];
  // structured triage (from AI suggestion, possibly edited)
  title?: string;
  category?: string;
  priority?: Priority;
  ai?: {
    suggested: boolean;
    edited: boolean;
    possibleCauses: string[];
    initialChecks: string[];
    recurringWarning?: string;
  };
}

export async function reportIssueAction(input: ReportIssueInput) {
  const complaint = input.complaint?.trim();
  if (!complaint) return { ok: false, error: "Please describe the issue." };

  await connectDB();
  const asset = await Asset.findOne({ publicId: input.assetPublicId.toLowerCase() });
  if (!asset) return { ok: false, error: "Asset not found." };
  if (asset.status === "Retired") {
    return { ok: false, error: "This asset has been retired. Reporting is disabled." };
  }

  const priority: Priority = input.priority ?? "medium";
  const seq = await Counter.findAndIncrement("issueNumber");
  const issueNumber = formatIssueNumber(seq);

  // Recurring warning: does this asset have ≥1 prior issues with overlapping keywords?
  const priorIssues = await Issue.find({ asset: asset._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title priority createdAt");

  const ai = input.ai ?? {
    suggested: false,
    edited: false,
    possibleCauses: [],
    initialChecks: [],
    recurringWarning: priorIssues.length >= 2 ? "This asset has had multiple recent reports — consider a full inspection." : undefined,
  };

  try {
    const issue = await Issue.create({
      issueNumber,
      asset: asset._id,
      title: (input.title?.trim() || complaint).slice(0, 160),
      description: complaint,
      category: input.category?.trim() || asset.category || "Other",
      priority,
      status: "Reported",
      reporterName: input.reporterName?.trim() || "Anonymous Reporter",
      reporterContact: input.reporterContact?.trim() || "",
      evidenceUrls: input.evidenceUrls ?? [],
      assignedTo: null,
      ai,
    });

    // Asset auto-transition: critical -> Out of Service, else Issue Reported.
    const newAssetStatus = statusForNewIssue(priority);
    asset.status = newAssetStatus;
    await asset.save();

    await HistoryEvent.log({
      asset: asset._id,
      actor: issue.reporterName,
      action: `Issue reported — ${issue.title}`,
      relatedIssue: issue._id,
      meta: { issueNumber, priority, fromStatus: "Operational", toStatus: newAssetStatus },
    });
    await HistoryEvent.log({
      asset: asset._id,
      actor: "System",
      action: `Asset status changed to ${newAssetStatus}`,
      relatedIssue: issue._id,
    });

    revalidatePath("/console");
    revalidatePath("/console/issues");
    revalidatePath(`/console/assets/${asset._id}`);
    revalidatePath(`/asset/${asset.publicId}`);

    return { ok: true, issueId: String(issue._id), issueNumber };
  } catch (err) {
    console.error("[reportIssue]", err);
    return { ok: false, error: "Could not submit your report. Please try again." };
  }
}

// ============================================================
// Assign an issue (admin/supervisor only)
// ============================================================
export async function assignIssueAction(issueId: string, technicianId: string) {
  const session = await getSession();
  if (!session || !can(session.user.role, "assignIssues")) {
    return { ok: false, error: "You don’t have permission to assign issues." };
  }
  await connectDB();
  const issue = await Issue.findById(issueId);
  if (!issue) return { ok: false, error: "Issue not found." };
  if (!isEditableStatus(issue.status)) {
    return { ok: false, error: "This issue is closed. Reopen it before assigning." };
  }

  // Assigning for the first time advances Reported -> Assigned.
  const wasAssigned = issue.status;
  issue.assignedTo = (technicianId || null) as any;
  if (issue.status === "Reported") issue.status = "Assigned";

  try {
    await issue.save();
    await HistoryEvent.log({
      asset: issue.asset,
      actor: session.user.name,
      actorRef: session.user.id,
      action: `Issue assigned to technician`,
      relatedIssue: issue._id,
      meta: { technicianId, statusBefore: wasAssigned, statusAfter: issue.status },
    });

    revalidatePath("/console");
    revalidatePath("/console/issues");
    revalidatePath(`/console/issues/${issueId}`);
    revalidatePath(`/console/assets/${issue.asset}`);
    return { ok: true };
  } catch (err) {
    console.error("[assignIssue]", err);
    return { ok: false, error: "Could not assign the issue." };
  }
}

// ============================================================
// Transition an issue's status with full business-rule checks.
// ============================================================
export async function transitionIssueAction(issueId: string, to: IssueStatus) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  await connectDB();
  const issue = await Issue.findById(issueId);
  if (!issue) return { ok: false, error: "Issue not found." };

  if (!isEditableStatus(issue.status)) {
    return { ok: false, error: "This issue is closed. Reopen it first." };
  }

  // Authorization: technicians may only touch issues assigned to them.
  if (session.user.role === "technician") {
    if (!issue.assignedTo || String(issue.assignedTo) !== session.user.id) {
      return { ok: false, error: "You can only update issues assigned to you." };
    }
  } else if (!can(session.user.role, "transitionAnyIssue")) {
    return { ok: false, error: "You don’t have permission to change issue status." };
  }

  // Validate the transition graph (Section 4).
  if (!isValidTransition(issue.status as IssueStatus, to)) {
    return { ok: false, error: `Cannot move from “${issue.status}” to “${to}”.` };
  }

  // Resolving requires an attached maintenance record.
  if (to === "Resolved") {
    const maintCount = await MaintenanceRecord.countDocuments({ issue: issue._id });
    if (maintCount === 0) {
      return { ok: false, error: "Cannot resolve without a maintenance record." };
    }
  }

  const from = issue.status as IssueStatus;
  const prevAssetStatus = await Asset.findById(issue.asset).select("status name publicId");
  issue.status = to;
  if (to === "Reopened") {
    // On reopen, clear the resolution path; staff re-triages.
  }

  try {
    await issue.save();

    // Drive asset status from the issue lifecycle.
    const derived = derivedAssetStatus(to);
    if (derived && prevAssetStatus) {
      prevAssetStatus.status = derived;
      await prevAssetStatus.save();
      await HistoryEvent.log({
        asset: issue.asset,
        actor: session.user.name,
        actorRef: session.user.id,
        action: `Asset status changed to ${derived}`,
        relatedIssue: issue._id,
      });
    }

    await HistoryEvent.log({
      asset: issue.asset,
      actor: session.user.name,
      actorRef: session.user.id,
      action: `Issue status: ${from} → ${to}`,
      relatedIssue: issue._id,
    });

    revalidatePath("/console");
    revalidatePath("/console/issues");
    revalidatePath(`/console/issues/${issueId}`);
    revalidatePath(`/console/assets/${issue.asset}`);
    if (prevAssetStatus) revalidatePath(`/asset/${prevAssetStatus.publicId}`);
    return { ok: true };
  } catch (err) {
    console.error("[transitionIssue]", err);
    return { ok: false, error: "Could not update the issue status." };
  }
}

// ============================================================
// Record a maintenance entry (technician/admin).
// ============================================================
export interface MaintenanceInput {
  issueId: string;
  findings: string;
  workPerformed: string;
  parts?: { name: string; quantity: number; cost: number }[];
  cost?: number;
  timeSpent?: string;
  evidenceUrls?: string[];
  finalCondition?: string;
}

export async function recordMaintenanceAction(input: MaintenanceInput) {
  const session = await getSession();
  if (!session || !can(session.user.role, "recordMaintenance")) {
    return { ok: false, error: "You don’t have permission to record maintenance." };
  }

  const findings = input.findings?.trim();
  const work = input.workPerformed?.trim();
  if (!findings || !work) {
    return { ok: false, error: "Findings and work performed are required." };
  }

  // cost >= 0 enforced at model level, but validate early for a clean error.
  const cost = Math.max(0, Number(input.cost ?? 0));
  if (Number.isNaN(cost)) return { ok: false, error: "Cost must be a number." };

  await connectDB();
  const issue = await Issue.findById(input.issueId);
  if (!issue) return { ok: false, error: "Issue not found." };

  // Technicians may only record maintenance on issues assigned to them.
  if (session.user.role === "technician" && (!issue.assignedTo || String(issue.assignedTo) !== session.user.id)) {
    return { ok: false, error: "You can only record maintenance on issues assigned to you." };
  }

  const parts = (input.parts ?? []).filter((p) => p.name?.trim()).map((p) => ({
    name: p.name.trim(),
    quantity: Math.max(1, Number(p.quantity) || 1),
    cost: Math.max(0, Number(p.cost) || 0),
  }));

  try {
    const rec = await MaintenanceRecord.create({
      issue: issue._id,
      technician: session.user.id,
      findings,
      workPerformed: work,
      parts,
      cost,
      timeSpent: input.timeSpent?.trim() || "",
      evidenceUrls: input.evidenceUrls ?? [],
      finalCondition: (input.finalCondition || "Good") as any,
    });

    // Recording maintenance also updates the asset's lastServiceDate + condition.
    const asset = await Asset.findById(issue.asset);
    if (asset) {
      asset.lastServiceDate = rec.completedAt;
      asset.condition = rec.finalCondition;
      await asset.save();
    }

    await HistoryEvent.log({
      asset: issue.asset,
      actor: session.user.name,
      actorRef: session.user.id,
      action: `Maintenance recorded — ${work.slice(0, 80)}`,
      relatedIssue: issue._id,
      meta: { cost, partsCount: parts.length },
    });

    revalidatePath("/console");
    revalidatePath("/console/issues");
    revalidatePath(`/console/issues/${input.issueId}`);
    revalidatePath(`/console/assets/${issue.asset}`);
    revalidatePath("/console/maintenance");
    return { ok: true, id: String(rec._id) };
  } catch (err) {
    console.error("[recordMaintenance]", err);
    return { ok: false, error: "Could not save the maintenance record." };
  }
}
