import "server-only";
import type { HydratedDocument } from "mongoose";
import type {
  Asset,
  HistoryEvent,
  Issue,
  MaintenanceRecord,
  User,
} from "./types";
import type { AssetDoc } from "@/models/Asset";
import type { IssueDoc } from "@/models/Issue";
import type { MaintenanceDoc } from "@/models/MaintenanceRecord";
import type { HistoryDoc } from "@/models/HistoryEvent";
import type { UserDoc } from "@/models/User";
import { formatIssueNumber } from "./format";

type AssetD = HydratedDocument<AssetDoc>;
type IssueD = HydratedDocument<IssueDoc>;
type MaintD = HydratedDocument<MaintenanceDoc>;
type HistoryD = HydratedDocument<HistoryDoc>;

function toDate(v: unknown): string | undefined {
  if (!v) return undefined;
  const d = v instanceof Date ? v : new Date(v as string);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function serializeUserRef(u: UserDoc | null | undefined) {
  if (!u) return null;
  return { id: String(u._id), name: u.name };
}

export function serializeUser(u: UserDoc | null | undefined): User | null {
  if (!u) return null;
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role as User["role"],
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
  };
}

export function serializeAsset(
  a: AssetD | null,
  opts: { technician?: UserDoc | null; creator?: UserDoc | null } = {}
): Asset | null {
  if (!a) return null;
  return {
    id: String(a._id),
    name: a.name,
    assetCode: a.assetCode,
    category: a.category,
    location: a.location,
    condition: a.condition as Asset["condition"],
    status: a.status as Asset["status"],
    lastServiceDate: toDate(a.lastServiceDate),
    nextServiceDate: toDate(a.nextServiceDate),
    assignedTechnician: opts.technician ? serializeUserRef(opts.technician) : null,
    publicId: a.publicId,
    createdBy: opts.creator ? serializeUserRef(opts.creator) : null,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : String(a.updatedAt),
  };
}

export function serializeIssue(
  i: IssueD | null,
  opts: { asset?: AssetD | null; assignee?: UserDoc | null } = {}
): Issue | null {
  if (!i) return null;
  const asset = opts.asset;
  return {
    id: String(i._id),
    issueNumber: i.issueNumber,
    asset: {
      id: String(i.asset),
      name: asset?.name ?? "Unknown asset",
      assetCode: asset?.assetCode ?? "—",
      publicId: asset?.publicId ?? "",
      location: asset?.location ?? "—",
    },
    title: i.title,
    description: i.description,
    category: i.category,
    priority: i.priority as Issue["priority"],
    status: i.status as Issue["status"],
    reporterName: i.reporterName,
    reporterContact: i.reporterContact ?? "",
    evidenceUrls: i.evidenceUrls ?? [],
    assignedTo: opts.assignee ? serializeUserRef(opts.assignee) : null,
    ai: {
      suggested: i.ai?.suggested ?? false,
      edited: i.ai?.edited ?? false,
      possibleCauses: i.ai?.possibleCauses ?? [],
      initialChecks: i.ai?.initialChecks ?? [],
      recurringWarning: i.ai?.recurringWarning ?? undefined,
    },
    createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : String(i.createdAt),
    updatedAt: i.updatedAt instanceof Date ? i.updatedAt.toISOString() : String(i.updatedAt),
  };
}

export function serializeMaintenance(
  m: MaintD | null,
  opts: { issue?: IssueD | null; technician?: UserDoc | null } = {}
): MaintenanceRecord | null {
  if (!m) return null;
  const tech = opts.technician
    ? serializeUserRef(opts.technician) ?? { id: String(m.technician), name: "Unknown" }
    : { id: String(m.technician), name: "Unknown" };
  return {
    id: String(m._id),
    issue: { id: String(m.issue), issueNumber: opts.issue?.issueNumber ?? formatIssueNumber(0) },
    technician: tech,
    findings: m.findings,
    workPerformed: m.workPerformed,
    parts: (m.parts ?? []).map((p) => ({ name: p.name, quantity: p.quantity, cost: p.cost })),
    cost: m.cost,
    timeSpent: m.timeSpent || undefined,
    evidenceUrls: m.evidenceUrls ?? [],
    finalCondition: m.finalCondition as MaintenanceRecord["finalCondition"],
    completedAt: m.completedAt instanceof Date ? m.completedAt.toISOString() : String(m.completedAt),
  };
}

export function serializeHistory(
  h: HistoryD | null,
  opts: { asset?: AssetD | null; issue?: IssueD | null } = {}
): HistoryEvent | null {
  if (!h) return null;
  const asset = opts.asset;
  return {
    id: String(h._id),
    asset: {
      id: String(h.asset),
      name: asset?.name ?? "Asset",
      publicId: asset?.publicId ?? "",
    },
    actor: h.actor,
    action: h.action,
    relatedIssue: h.relatedIssue
      ? { id: String(h.relatedIssue), issueNumber: opts.issue?.issueNumber ?? "" }
      : null,
    meta: h.meta as Record<string, unknown>,
    createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : String(h.createdAt),
  };
}
