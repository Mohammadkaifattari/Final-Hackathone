// ============================================================
// MaintainIQ — shared domain types
// (Single source of truth; Mongoose models in Phase 3 will
//  reuse these literal unions so the DB matches the UI.)
// ============================================================

export type Role = "admin" | "technician" | "supervisor";

export type AssetStatus =
  | "Operational"
  | "Issue Reported"
  | "Under Inspection"
  | "Under Maintenance"
  | "Out of Service"
  | "Retired";

export type AssetCondition = "Excellent" | "Good" | "Fair" | "Poor";

export type Priority = "low" | "medium" | "high" | "critical";

export type IssueStatus =
  | "Reported"
  | "Assigned"
  | "Inspection Started"
  | "Maintenance In Progress"
  | "Waiting for Parts"
  | "Resolved"
  | "Closed"
  | "Reopened";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  assetCode: string; // unique
  category: string;
  location: string;
  condition: AssetCondition;
  status: AssetStatus;
  lastServiceDate?: string;
  nextServiceDate?: string;
  assignedTechnician?: Pick<User, "id" | "name"> | null;
  publicId: string; // stable slug used in QR URL — never changes
  createdBy?: Pick<User, "id" | "name"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AITriage {
  suggested: boolean;
  edited: boolean;
  possibleCauses: string[];
  initialChecks: string[];
  recurringWarning?: string;
}

export interface Issue {
  id: string;
  issueNumber: string; // e.g. ISS-0001
  asset: Pick<Asset, "id" | "name" | "assetCode" | "publicId" | "location">;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: IssueStatus;
  reporterName: string;
  reporterContact?: string;
  evidenceUrls: string[];
  assignedTo?: Pick<User, "id" | "name"> | null;
  ai: AITriage;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenancePart {
  name: string;
  quantity: number;
  cost: number;
}

export interface MaintenanceRecord {
  id: string;
  issue: Pick<Issue, "id" | "issueNumber">;
  technician: Pick<User, "id" | "name">;
  findings: string;
  workPerformed: string;
  parts: MaintenancePart[];
  cost: number;
  timeSpent?: string;
  evidenceUrls: string[];
  finalCondition: AssetCondition;
  completedAt: string;
}

export interface HistoryEvent {
  id: string;
  asset: Pick<Asset, "id" | "name" | "publicId">;
  actor: string;
  action: string;
  relatedIssue?: Pick<Issue, "id" | "issueNumber"> | null;
  meta?: Record<string, unknown>;
  createdAt: string;
}

// ---- constants used across UI + business rules ----
export const ASSET_STATUSES: AssetStatus[] = [
  "Operational",
  "Issue Reported",
  "Under Inspection",
  "Under Maintenance",
  "Out of Service",
  "Retired",
];

export const ISSUE_STATUSES: IssueStatus[] = [
  "Reported",
  "Assigned",
  "Inspection Started",
  "Maintenance In Progress",
  "Waiting for Parts",
  "Resolved",
  "Closed",
  "Reopened",
];

export const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

export const CATEGORIES = [
  "Audio/Visual",
  "HVAC",
  "IT Equipment",
  "Machinery",
  "Furniture",
  "Plumbing",
  "Electrical",
  "Vehicle",
  "Other",
] as const;
