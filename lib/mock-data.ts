// ============================================================
// MOCK DATA — Phase 1 only. Phase 3 replaces every read here
// with real Mongoose queries. Shape matches lib/types.ts exactly
// so swapping the data source is mechanical.
// ============================================================
import type {
  Asset,
  HistoryEvent,
  Issue,
  MaintenanceRecord,
  User,
} from "./types";

export const MOCK_USERS: User[] = [
  {
    id: "u_admin",
    name: "Ayesha Khan",
    email: "admin@maintainiq.app",
    role: "admin",
    createdAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "u_tech",
    name: "Bilal Raza",
    email: "tech@maintainiq.app",
    role: "technician",
    createdAt: "2026-06-02T09:00:00.000Z",
  },
  {
    id: "u_sup",
    name: "Sana Malik",
    email: "supervisor@maintainiq.app",
    role: "supervisor",
    createdAt: "2026-06-03T09:00:00.000Z",
  },
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: "a_proj01",
    name: "Classroom Projector 01",
    assetCode: "AV-PRJ-0001",
    category: "Audio/Visual",
    location: "Block C · Room 204",
    condition: "Fair",
    status: "Issue Reported",
    lastServiceDate: "2026-05-12",
    nextServiceDate: "2026-11-12",
    assignedTechnician: { id: "u_tech", name: "Bilal Raza" },
    publicId: "classroom-projector-01",
    createdBy: { id: "u_admin", name: "Ayesha Khan" },
    createdAt: "2026-04-10T09:00:00.000Z",
    updatedAt: "2026-07-09T14:20:00.000Z",
  },
  {
    id: "a_ac01",
    name: "Lab Air Conditioner 03",
    assetCode: "HVAC-AC-0003",
    category: "HVAC",
    location: "Block A · Computer Lab",
    condition: "Good",
    status: "Operational",
    lastServiceDate: "2026-06-28",
    nextServiceDate: "2026-12-28",
    assignedTechnician: null,
    publicId: "lab-ac-unit-03",
    createdBy: { id: "u_admin", name: "Ayesha Khan" },
    createdAt: "2026-03-15T09:00:00.000Z",
    updatedAt: "2026-06-28T11:00:00.000Z",
  },
  {
    id: "a_print01",
    name: "Reception Multifunction Printer",
    assetCode: "IT-PRT-0010",
    category: "IT Equipment",
    location: "Main Building · Reception",
    condition: "Poor",
    status: "Under Maintenance",
    lastServiceDate: "2026-07-01",
    nextServiceDate: "2026-10-01",
    assignedTechnician: { id: "u_tech", name: "Bilal Raza" },
    publicId: "reception-printer-0010",
    createdBy: { id: "u_admin", name: "Ayesha Khan" },
    createdAt: "2026-02-20T09:00:00.000Z",
    updatedAt: "2026-07-10T08:45:00.000Z",
  },
  {
    id: "a_lathe01",
    name: "CNC Lathe Machine 02",
    assetCode: "MCH-CNC-0002",
    category: "Machinery",
    location: "Workshop · Bay 2",
    condition: "Fair",
    status: "Out of Service",
    lastServiceDate: "2026-06-15",
    nextServiceDate: "2026-09-15",
    assignedTechnician: { id: "u_tech", name: "Bilal Raza" },
    publicId: "cnc-lathe-0002",
    createdBy: { id: "u_admin", name: "Ayesha Khan" },
    createdAt: "2026-01-05T09:00:00.000Z",
    updatedAt: "2026-07-08T16:30:00.000Z",
  },
  {
    id: "a_door01",
    name: "East Entrance Automatic Door",
    assetCode: "ELC-DR-0007",
    category: "Electrical",
    location: "Main Building · East Entrance",
    condition: "Excellent",
    status: "Operational",
    lastServiceDate: "2026-07-05",
    nextServiceDate: "2027-01-05",
    assignedTechnician: null,
    publicId: "east-auto-door-0007",
    createdBy: { id: "u_admin", name: "Ayesha Khan" },
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-07-05T10:00:00.000Z",
  },
];

export const MOCK_ISSUES: Issue[] = [
  {
    id: "iss_0001",
    issueNumber: "ISS-0001",
    asset: {
      id: "a_proj01",
      name: "Classroom Projector 01",
      assetCode: "AV-PRJ-0001",
      publicId: "classroom-projector-01",
      location: "Block C · Room 204",
    },
    title: "Projector flickers and loses HDMI signal",
    description:
      "The projector keeps flickering and there is no HDMI signal during lectures. Happens intermittently mid-class.",
    category: "Audio/Visual",
    priority: "high",
    status: "Reported",
    reporterName: "Anonymous Reporter",
    reporterContact: "",
    evidenceUrls: [],
    assignedTo: null,
    ai: {
      suggested: true,
      edited: false,
      possibleCauses: [
        "Damaged or loose HDMI cable",
        "Overheating bulb / cooling fan failure",
        "Faulty HDMI port on the projector",
      ],
      initialChecks: [
        "Reseat the HDMI cable at both ends",
        "Test with a known-good cable",
        "Check for dust in vents / overheating warning",
      ],
    },
    createdAt: "2026-07-09T14:20:00.000Z",
    updatedAt: "2026-07-09T14:20:00.000Z",
  },
  {
    id: "iss_0002",
    issueNumber: "ISS-0002",
    asset: {
      id: "a_print01",
      name: "Reception Multifunction Printer",
      assetCode: "IT-PRT-0010",
      publicId: "reception-printer-0010",
      location: "Main Building · Reception",
    },
    title: "Printer jams on every second page",
    description:
      "Paper jams repeatedly. Roller seems to slip. Causing delays at reception.",
    category: "IT Equipment",
    priority: "medium",
    status: "Maintenance In Progress",
    reporterName: "Reception Desk",
    reporterContact: "reception@example.org",
    evidenceUrls: [],
    assignedTo: { id: "u_tech", name: "Bilal Raza" },
    ai: {
      suggested: true,
      edited: true,
      possibleCauses: ["Worn pickup roller", "Foreign object in paper path"],
      initialChecks: ["Inspect pickup roller for wear", "Clear paper path"],
    },
    createdAt: "2026-07-08T08:45:00.000Z",
    updatedAt: "2026-07-10T08:45:00.000Z",
  },
  {
    id: "iss_0003",
    issueNumber: "ISS-0003",
    asset: {
      id: "a_lathe01",
      name: "CNC Lathe Machine 02",
      assetCode: "MCH-CNC-0002",
      publicId: "cnc-lathe-0002",
      location: "Workshop · Bay 2",
    },
    title: "Unusual vibration + burning smell from spindle",
    description:
      "Strong vibration and burning smell during operation. Operator stopped the machine immediately.",
    category: "Machinery",
    priority: "critical",
    status: "Maintenance In Progress",
    reporterName: "Workshop Operator",
    reporterContact: "shop@example.org",
    evidenceUrls: [],
    assignedTo: { id: "u_tech", name: "Bilal Raza" },
    ai: {
      suggested: true,
      edited: false,
      possibleCauses: [
        "Spindle bearing failure",
        "Overload / tool collision",
        "Lubrication system failure",
      ],
      initialChecks: [
        "DO NOT OPERATE — lockout required",
        "Inspect spindle bearings for heat damage",
        "Check lubrication system",
      ],
      recurringWarning:
        "This asset has reported vibration issues twice in the last 3 months — consider a full service.",
    },
    createdAt: "2026-07-07T16:30:00.000Z",
    updatedAt: "2026-07-08T16:30:00.000Z",
  },
  {
    id: "iss_0004",
    issueNumber: "ISS-0004",
    asset: {
      id: "a_ac01",
      name: "Lab Air Conditioner 03",
      assetCode: "HVAC-AC-0003",
      publicId: "lab-ac-unit-03",
      location: "Block A · Computer Lab",
    },
    title: "AC not cooling efficiently",
    description: "Room temperature above normal. Filter may be clogged.",
    category: "HVAC",
    priority: "low",
    status: "Resolved",
    reporterName: "Lab Incharge",
    reporterContact: "lab@example.org",
    evidenceUrls: [],
    assignedTo: { id: "u_tech", name: "Bilal Raza" },
    ai: {
      suggested: true,
      edited: false,
      possibleCauses: ["Clogged air filter", "Low refrigerant"],
      initialChecks: ["Clean/replace filter", "Check refrigerant level"],
    },
    createdAt: "2026-06-25T10:00:00.000Z",
    updatedAt: "2026-06-28T11:00:00.000Z",
  },
];

export const MOCK_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: "mr_0001",
    issue: { id: "iss_0004", issueNumber: "ISS-0004" },
    technician: { id: "u_tech", name: "Bilal Raza" },
    findings: "Air filter heavily clogged with dust; refrigerant level normal.",
    workPerformed:
      "Removed and cleaned filter, flushed drain line, tested cooling cycle.",
    parts: [{ name: "Air filter (universal cut-to-fit)", quantity: 1, cost: 8.5 }],
    cost: 8.5,
    timeSpent: "45 min",
    evidenceUrls: [],
    finalCondition: "Good",
    completedAt: "2026-06-28T11:00:00.000Z",
  },
];

export const MOCK_HISTORY: HistoryEvent[] = [
  {
    id: "h_0005",
    asset: { id: "a_proj01", name: "Classroom Projector 01", publicId: "classroom-projector-01" },
    actor: "Anonymous Reporter",
    action: "Issue reported — flickering + no HDMI signal",
    relatedIssue: { id: "iss_0001", issueNumber: "ISS-0001" },
    createdAt: "2026-07-09T14:20:00.000Z",
  },
  {
    id: "h_0004",
    asset: { id: "a_proj01", name: "Classroom Projector 01", publicId: "classroom-projector-01" },
    actor: "Ayesha Khan",
    action: "Scheduled next service for 2026-11-12",
    createdAt: "2026-05-12T10:00:00.000Z",
  },
  {
    id: "h_0003",
    asset: { id: "a_proj01", name: "Classroom Projector 01", publicId: "classroom-projector-01" },
    actor: "Bilal Raza",
    action: "Routine maintenance — bulb cleaned, firmware updated",
    createdAt: "2026-05-12T09:30:00.000Z",
  },
  {
    id: "h_0002",
    asset: { id: "a_proj01", name: "Classroom Projector 01", publicId: "classroom-projector-01" },
    actor: "Ayesha Khan",
    action: "Assigned technician: Bilal Raza",
    createdAt: "2026-04-11T09:00:00.000Z",
  },
  {
    id: "h_0001",
    asset: { id: "a_proj01", name: "Classroom Projector 01", publicId: "classroom-projector-01" },
    actor: "Ayesha Khan",
    action: "Asset registered and QR sticker generated",
    createdAt: "2026-04-10T09:00:00.000Z",
  },
];

// ---- helpers (these become DB queries in Phase 3) ----
export function getAssetByPublicId(publicId: string): Asset | undefined {
  return MOCK_ASSETS.find((a) => a.publicId === publicId);
}
export function getAssetById(id: string): Asset | undefined {
  return MOCK_ASSETS.find((a) => a.id === id);
}
export function getIssuesForAsset(assetId: string): Issue[] {
  return MOCK_ISSUES.filter((i) => i.asset.id === assetId);
}
export function getHistoryForAsset(assetId: string): HistoryEvent[] {
  return MOCK_HISTORY.filter((h) => h.asset.id === assetId);
}
export function getMaintenanceForIssue(issueId: string): MaintenanceRecord[] {
  return MOCK_MAINTENANCE.filter((m) => m.issue.id === issueId);
}

// ---- dashboard metrics (computed from mock data) ----
export interface DashboardMetrics {
  totalAssets: number;
  openIssues: number;
  criticalIssues: number;
  outOfService: number;
  dueForService: number;
}
export function getDashboardMetrics(): DashboardMetrics {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return {
    totalAssets: MOCK_ASSETS.length,
    openIssues: MOCK_ISSUES.filter((i) =>
      ["Reported", "Assigned", "Inspection Started", "Maintenance In Progress", "Waiting for Parts", "Reopened"].includes(
        i.status
      )
    ).length,
    criticalIssues: MOCK_ISSUES.filter((i) => i.priority === "critical").length,
    outOfService: MOCK_ASSETS.filter((a) => a.status === "Out of Service").length,
    dueForService: MOCK_ASSETS.filter(
      (a) => a.nextServiceDate && new Date(a.nextServiceDate).getTime() - now <= thirtyDays
    ).length,
  };
}
