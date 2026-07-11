// ============================================================
// MOCK triage — Phase 1 only. Produces a structured suggestion
// identical in shape to the real AI route (Phase 4), so the UI
// never changes when we swap in the real call. Mirrors the Zod
// schema used by app/api/ai/triage/route.ts.
// ============================================================
import type { Priority } from "./types";

export interface TriageInput {
  complaint: string;
  assetName: string;
  assetCategory: string;
  assetCondition?: string;
  recentIssues?: string[];
}

export interface TriageResult {
  title: string;
  category: string;
  priority: Priority;
  possibleCauses: string[];
  initialChecks: string[];
  recurringWarning?: string;
}

/** Keyword-based mock that produces plausible structured output. */
export function mockTriage(input: TriageInput): Promise<TriageResult> {
  const c = input.complaint.toLowerCase();
  let priority: Priority = "medium";

  if (/burn|smoke|fire|spark|shock|electr|vibration|explode|leak.*gas|critical/.test(c)) {
    priority = "critical";
  } else if (/flicker|no signal|broken|jam|not working|overheat|stops|fail/.test(c)) {
    priority = "high";
  } else if (/slow|noise|noisy|dirty|clog|dust|rattl/.test(c)) {
    priority = "medium";
  } else if (/cosmetic|scratch|label|minor/.test(c)) {
    priority = "low";
  }

  const result: TriageResult = {
    title: deriveTitle(input.complaint),
    category: input.assetCategory || "Other",
    priority,
    possibleCauses: deriveCauses(c, input.assetCategory),
    initialChecks: deriveChecks(c, input.assetCategory),
  };

  if (input.recentIssues && input.recentIssues.length >= 2) {
    result.recurringWarning =
      "This asset has had similar reports recently — consider a full inspection.";
  }

  // simulate latency so loading states are exercised during the demo
  return new Promise((resolve) => setTimeout(() => resolve(result), 900));
}

function deriveTitle(complaint: string): string {
  const trimmed = complaint.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 70) return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return trimmed.slice(0, 67).trim() + "...";
}

function deriveCauses(c: string, category: string): string[] {
  const causes: string[] = [];
  if (/hdmi|signal|display|projector|monitor|screen|flicker/.test(c)) {
    causes.push("Damaged or loose video/HDMI cable", "Faulty port or connector", "Overheating or failing display unit");
  } else if (/jam|paper/.test(c)) {
    causes.push("Worn or dirty pickup roller", "Foreign object in the paper path", "Incorrect paper weight setting");
  } else if (/cool|ac|air condition|hvac|refriger/.test(c) || category === "HVAC") {
    causes.push("Clogged air filter", "Low refrigerant level", "Blocked or leaky ductwork");
  } else if (/vibrat|bear|spindle|machine|cnc|lathe/.test(c) || category === "Machinery") {
    causes.push("Worn spindle bearings", "Lubrication system failure", "Tool collision / overload");
  } else if (/network|internet|wifi|connect|slow/.test(c) || category === "IT Equipment") {
    causes.push("Faulty network cable or port", "Firmware/driver issue", "Bandwidth or configuration problem");
  } else {
    causes.push("Worn or damaged component", "Loose connection or fitting", "Environmental factor (dust, heat, humidity)");
  }
  return causes.slice(0, 3);
}

function deriveChecks(c: string, category: string): string[] {
  const checks: string[] = [];
  if (/burn|smoke|fire|spark|shock|electr/.test(c)) {
    checks.push("DO NOT OPERATE — disconnect power and lock out the asset", "Do not attempt repair; request a qualified technician");
  }
  if (/hdmi|signal|display|projector|flicker/.test(c)) {
    checks.push("Reseat the cable at both ends", "Test with a known-good cable");
  } else if (/jam|paper/.test(c)) {
    checks.push("Open paper path and remove debris", "Inspect pickup roller for wear");
  } else if (category === "HVAC" || /cool|ac/.test(c)) {
    checks.push("Inspect and clean the air filter", "Check for ice buildup on coils");
  } else {
    checks.push("Visually inspect for obvious damage", "Confirm power/connections are secure", "Reproduce the reported symptom");
  }
  if (checks.length === 0) checks.push("Visually inspect the asset", "Reproduce the reported symptom");
  return checks.slice(0, 3);
}
