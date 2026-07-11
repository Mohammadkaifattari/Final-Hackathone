import "server-only";
import { connectDB } from "./mongodb";
import Asset from "@/models/Asset";
import Issue from "@/models/Issue";
import MaintenanceRecord from "@/models/MaintenanceRecord";
import HistoryEvent from "@/models/HistoryEvent";
import User from "@/models/User";
import {
  serializeAsset,
  serializeHistory,
  serializeIssue,
  serializeMaintenance,
  serializeUserRef,
} from "./serialize";
import { OPEN_ISSUE_STATUSES } from "./business-rules";
import type { Asset as AssetT, HistoryEvent as HistoryT, Issue as IssueT, MaintenanceRecord as MaintT } from "./types";

export async function getAllAssets(): Promise<AssetT[]> {
  await connectDB();
  const docs = await Asset.find().sort({ createdAt: -1 }).lean().populate([
    { path: "assignedTechnician", model: User },
    { path: "createdBy", model: User },
  ]);
  // lean() returns POJOs without mongoose methods; serialize handles both shapes.
  return docs
    .map((d) =>
      serializeAsset(d as never, {
        technician: (d as { assignedTechnician?: unknown }).assignedTechnician as never,
        creator: (d as { createdBy?: unknown }).createdBy as never,
      })
    )
    .filter((a): a is AssetT => a !== null);
}

export async function getAssetById(id: string): Promise<AssetT | null> {
  await connectDB();
  const doc = await Asset.findById(id).populate([
    { path: "assignedTechnician", model: User },
    { path: "createdBy", model: User },
  ]);
  if (!doc) return null;
  return serializeAsset(doc as never, {
    technician: (doc as { assignedTechnician?: unknown }).assignedTechnician as never,
    creator: (doc as { createdBy?: unknown }).createdBy as never,
  });
}

export async function getAssetByPublicId(publicId: string): Promise<AssetT | null> {
  await connectDB();
  const doc = await Asset.findOne({ publicId: publicId.toLowerCase() }).populate([
    { path: "assignedTechnician", model: User },
    { path: "createdBy", model: User },
  ]);
  if (!doc) return null;
  return serializeAsset(doc as never, {
    technician: (doc as { assignedTechnician?: unknown }).assignedTechnician as never,
    creator: (doc as { createdBy?: unknown }).createdBy as never,
  });
}

export async function getAllIssues(): Promise<IssueT[]> {
  await connectDB();
  const docs = await Issue.find()
    .sort({ createdAt: -1 })
    .lean()
    .populate([{ path: "asset", model: Asset }, { path: "assignedTo", model: User }]);
  return docs
    .map((d) =>
      serializeIssue(d as never, {
        asset: (d as { asset?: unknown }).asset as never,
        assignee: (d as { assignedTo?: unknown }).assignedTo as never,
      })
    )
    .filter((i): i is IssueT => i !== null);
}

export async function getIssueById(id: string): Promise<IssueT | null> {
  await connectDB();
  const doc = await Issue.findById(id).populate([
    { path: "asset", model: Asset },
    { path: "assignedTo", model: User },
  ]);
  if (!doc) return null;
  return serializeIssue(doc as never, {
    asset: (doc as { asset?: unknown }).asset as never,
    assignee: (doc as { assignedTo?: unknown }).assignedTo as never,
  });
}

export async function getIssuesForAsset(assetId: string): Promise<IssueT[]> {
  await connectDB();
  const docs = await Issue.find({ asset: assetId })
    .sort({ createdAt: -1 })
    .lean()
    .populate([{ path: "asset", model: Asset }, { path: "assignedTo", model: User }]);
  return docs
    .map((d) =>
      serializeIssue(d as never, {
        asset: (d as { asset?: unknown }).asset as never,
        assignee: (d as { assignedTo?: unknown }).assignedTo as never,
      })
    )
    .filter((i): i is IssueT => i !== null);
}

export async function getMaintenanceForIssue(issueId: string): Promise<MaintT[]> {
  await connectDB();
  const docs = await MaintenanceRecord.find({ issue: issueId })
    .sort({ completedAt: -1 })
    .lean()
    .populate([{ path: "issue", model: Issue }, { path: "technician", model: User }]);
  return docs
    .map((d) =>
      serializeMaintenance(d as never, {
        issue: (d as { issue?: unknown }).issue as never,
        technician: (d as { technician?: unknown }).technician as never,
      })
    )
    .filter((m): m is MaintT => m !== null);
}

export async function getAllMaintenance(): Promise<MaintT[]> {
  await connectDB();
  const docs = await MaintenanceRecord.find()
    .sort({ completedAt: -1 })
    .lean()
    .populate([{ path: "issue", model: Issue }, { path: "technician", model: User }]);
  return docs
    .map((d) =>
      serializeMaintenance(d as never, {
        issue: (d as { issue?: unknown }).issue as never,
        technician: (d as { technician?: unknown }).technician as never,
      })
    )
    .filter((m): m is MaintT => m !== null);
}

export async function getHistoryForAsset(assetId: string): Promise<HistoryT[]> {
  await connectDB();
  const docs = await HistoryEvent.find({ asset: assetId })
    .sort({ createdAt: -1 })
    .lean()
    .populate([{ path: "asset", model: Asset }, { path: "relatedIssue", model: Issue }]);
  return docs
    .map((d) =>
      serializeHistory(d as never, {
        asset: (d as { asset?: unknown }).asset as never,
        issue: (d as { relatedIssue?: unknown }).relatedIssue as never,
      })
    )
    .filter((h): h is HistoryT => h !== null);
}

export async function getAllHistory(limit = 100): Promise<HistoryT[]> {
  await connectDB();
  const docs = await HistoryEvent.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .populate([{ path: "asset", model: Asset }, { path: "relatedIssue", model: Issue }]);
  return docs
    .map((d) =>
      serializeHistory(d as never, {
        asset: (d as { asset?: unknown }).asset as never,
        issue: (d as { relatedIssue?: unknown }).relatedIssue as never,
      })
    )
    .filter((h): h is HistoryT => h !== null);
}

export interface DashboardMetrics {
  totalAssets: number;
  openIssues: number;
  criticalIssues: number;
  outOfService: number;
  dueForService: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await connectDB();
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [totalAssets, openIssues, criticalIssues, outOfService, dueForService] = await Promise.all([
    Asset.countDocuments(),
    Issue.countDocuments({ status: { $in: OPEN_ISSUE_STATUSES } }),
    Issue.countDocuments({ status: { $in: OPEN_ISSUE_STATUSES }, priority: "critical" }),
    Asset.countDocuments({ status: "Out of Service" }),
    Asset.countDocuments({ nextServiceDate: { $gte: now, $lte: in30 } }),
  ]);

  return { totalAssets, openIssues, criticalIssues, outOfService, dueForService };
}

export async function getTechnicians() {
  await connectDB();
  const users = await User.find({ role: { $in: ["admin", "technician", "supervisor"] } })
    .sort({ name: 1 })
    .lean();
  return users.map((u) => serializeUserRef(u as never)).filter(Boolean);
}
