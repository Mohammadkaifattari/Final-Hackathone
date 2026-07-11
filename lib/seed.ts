// removed server-only
import { connectDB } from "./mongodb";
import User, { USER_ROLES } from "@/models/User";
import { slugify } from "./format";

function generatePublicId(): string {
  return `sku_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: (typeof USER_ROLES)[number];
}

const SEED_USERS: SeedUser[] = [
  { name: "Ayesha Khan", email: "admin@maintainiq.app", password: "admin123", role: "admin" },
  { name: "Bilal Raza", email: "tech@maintainiq.app", password: "tech123", role: "technician" },
  { name: "Sana Malik", email: "supervisor@maintainiq.app", password: "super123", role: "supervisor" },
];

/**
 * Idempotently seed the demo users. Safe to call on every boot: existing
 * users are left untouched, missing ones are created. Returns a summary.
 *
 * Called from a route handler so Vercel can trigger it; also runnable via
 * `npx tsx lib/seed.ts` locally.
 */
export async function seedUsers(): Promise<{ created: number; existing: number; skipped: number }> {
  await connectDB();
  let created = 0;
  let existing = 0;

  for (const u of SEED_USERS) {
    const found = await User.findOne({ email: u.email });
    if (found) {
      existing++;
      continue;
    }
    const doc = new User({ name: u.name, email: u.email, role: u.role });
    await doc.setPassword(u.password);
    await doc.save();
    created++;
  }

  return { created, existing, skipped: 0 };
}

export async function seedDemoData() {
  await connectDB();
  
  // Clean up existing data except users
  const Asset = (await import("@/models/Asset")).default;
  const Issue = (await import("@/models/Issue")).default;
  const MaintenanceRecord = (await import("@/models/MaintenanceRecord")).default;
  const HistoryEvent = (await import("@/models/HistoryEvent")).default;
  const Counter = (await import("@/models/Counter")).default;

  await Asset.deleteMany({});
  await Issue.deleteMany({});
  await MaintenanceRecord.deleteMany({});
  await HistoryEvent.deleteMany({});
  await Counter.deleteMany({});

  const admin = await User.findOne({ email: "admin@maintainiq.app" });
  const tech = await User.findOne({ email: "tech@maintainiq.app" });
  if (!admin || !tech) throw new Error("Users not seeded. Seed users first.");

  // Seed 10-15 assets
  const assets = await Asset.insertMany([
    { name: "Main HVAC Unit", assetCode: "HVAC-001", category: "HVAC", location: "Roof", condition: "Good", status: "Operational", publicId: generatePublicId(), createdBy: admin._id },
    { name: "Backup Generator", assetCode: "GEN-001", category: "Machinery", location: "Basement", condition: "Excellent", status: "Operational", publicId: generatePublicId(), createdBy: admin._id },
    { name: "Conference Projector", assetCode: "AV-001", category: "Audio/Visual", location: "Room 101", condition: "Fair", status: "Operational", publicId: generatePublicId(), createdBy: admin._id },
    { name: "Server Rack A", assetCode: "IT-001", category: "IT Equipment", location: "Server Room", condition: "Good", status: "Operational", publicId: generatePublicId(), createdBy: admin._id },
    { name: "Forklift", assetCode: "VEH-001", category: "Vehicle", location: "Warehouse", condition: "Poor", status: "Under Maintenance", publicId: generatePublicId(), createdBy: admin._id },
    { name: "Lobby Printer", assetCode: "IT-002", category: "IT Equipment", location: "Lobby", condition: "Good", status: "Operational", publicId: generatePublicId(), createdBy: admin._id },
    { name: "Cafeteria Fridge", assetCode: "OTH-001", category: "Other", location: "Cafeteria", condition: "Good", status: "Operational", publicId: generatePublicId(), createdBy: admin._id },
    { name: "Freight Elevator", assetCode: "MAC-002", category: "Machinery", location: "Loading Dock", condition: "Fair", status: "Issue Reported", publicId: generatePublicId(), createdBy: admin._id },
    { name: "Water Heater", assetCode: "PLB-001", category: "Plumbing", location: "Basement", condition: "Good", status: "Operational", publicId: generatePublicId(), createdBy: admin._id },
    { name: "Delivery Van", assetCode: "VEH-002", category: "Vehicle", location: "Parking", condition: "Good", status: "Operational", publicId: generatePublicId(), createdBy: admin._id },
    { name: "PA System", assetCode: "AV-002", category: "Audio/Visual", location: "Main Hall", condition: "Good", status: "Operational", publicId: generatePublicId(), createdBy: admin._id },
    { name: "Water Pump 1", assetCode: "PLB-002", category: "Plumbing", location: "Pump Room", condition: "Fair", status: "Operational", publicId: generatePublicId(), createdBy: admin._id },
  ]);

  // Create Counter
  await Counter.create({ _id: "issueNumber", seq: 3 });

  // Seed 5 issues
  const issue1 = await Issue.create({
    issueNumber: "ISS-0001",
    asset: assets[4]._id, // Forklift
    title: "Forklift battery not holding charge",
    description: "Needs replacement or deep cycle. Doesn't last full shift.",
    category: "Vehicle",
    priority: "high",
    status: "Maintenance In Progress",
    reporterName: "Warehouse Manager",
    assignedTo: tech._id,
    ai: { suggested: true, edited: false, possibleCauses: ["Dead cells", "Alternator"], initialChecks: ["Check voltage"] },
  });

  const issue2 = await Issue.create({
    issueNumber: "ISS-0002",
    asset: assets[7]._id, // Freight Elevator
    title: "Elevator doors jamming",
    description: "Doors don't open fully on floor 2.",
    category: "Machinery",
    priority: "critical",
    status: "Reported",
    reporterName: "Staff Member",
    ai: { suggested: true, edited: false, possibleCauses: ["Track debris", "Motor fault"], initialChecks: ["Inspect door tracks", "Listen for grinding noises"] },
  });

  const issue3 = await Issue.create({
    issueNumber: "ISS-0003",
    asset: assets[0]._id, // HVAC
    title: "Noisy fan operation",
    description: "Loud rattling sound coming from the unit.",
    category: "HVAC",
    priority: "medium",
    status: "Resolved",
    reporterName: "Building Admin",
    assignedTo: tech._id,
    ai: { suggested: true, edited: true, possibleCauses: ["Loose fan blade", "Bad bearings"], initialChecks: ["Check fan mount"] },
  });

  // Seed Maintenance Record
  await MaintenanceRecord.create({
    issue: issue3._id,
    technician: tech._id,
    findings: "Fan blade was loose and rattling against the housing.",
    workPerformed: "Tightened fan blade and added threadlocker. Lubricated bearings.",
    parts: [],
    cost: 15,
    timeSpent: "0.5h",
    evidenceUrls: [],
    finalCondition: "Good",
    completedAt: new Date(Date.now() - 86400000), // 1 day ago
  });

  // Seed History
  await HistoryEvent.log({ asset: assets[4]._id, actor: "Admin", action: "Assigned to Bilal Raza", relatedIssue: issue1._id });
  await HistoryEvent.log({ asset: assets[0]._id, actor: "Bilal Raza", action: "Resolved issue", relatedIssue: issue3._id });

  return { assets: assets.length, issues: 3 };
}

// CLI entrypoint
// (guarded so it doesn't run when imported)
const isDirect = require.main === module;
if (isDirect) {
  seedUsers()
    .then(() => seedDemoData())
    .then((r) => {
      console.log("[seed] done:", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error("[seed] failed:", e);
      process.exit(1);
    });
}
