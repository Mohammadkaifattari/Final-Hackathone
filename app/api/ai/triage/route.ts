import { NextResponse } from "next/server";
import { z } from "zod";
import { mockTriage } from "@/lib/mock-triage";
import { generateObject } from "ai";

// Phase 4 replaces mockTriage with the Vercel AI SDK + AI Gateway using
// generateObject + a Zod schema.
const Schema = z.object({
  complaint: z.string().trim().min(3),
  assetPublicId: z.string().trim().min(1),
  assetCategory: z.string().trim().optional(),
  assetName: z.string().trim().optional(),
});

const TriageSchema = z.object({
  title: z.string().describe("A concise summary of the issue, max 70 chars"),
  category: z.string().describe("The most likely category of the asset"),
  priority: z.enum(["low", "medium", "high", "critical"]).describe("Severity level of the issue"),
  possibleCauses: z.array(z.string()).max(3).describe("List of up to 3 possible causes"),
  initialChecks: z.array(z.string()).max(3).describe("List of up to 3 checks for the technician to perform"),
  recurringWarning: z.string().optional().describe("A warning if the issue seems like a recurring problem"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  // Attempt real AI triage
  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini" as any, // casting to any to bypass strict type check if it complains, or just use string
      schema: TriageSchema,
      prompt: `Analyze the following issue report for a maintenance system:
Complaint: "${parsed.data.complaint}"
Asset Name: "${parsed.data.assetName || "Unknown"}"
Asset Category: "${parsed.data.assetCategory || "Other"}"
Provide a clear title, select the priority, and suggest 2-3 possible causes and 2-3 initial checks for a technician.`,
    });
    
    // Add flags needed by the UI
    const triage = {
      ...object,
      suggested: true,
      edited: false,
    };
    
    return NextResponse.json({ ok: true, triage });
  } catch (error) {
    console.error("[AITriage] Real AI failed, falling back to mock", error);
    try {
      const triage = await mockTriage({
        complaint: parsed.data.complaint,
        assetName: parsed.data.assetName ?? parsed.data.assetPublicId,
        assetCategory: parsed.data.assetCategory ?? "Other",
      });
      // The mock returns a TriageResult, ensure flags exist
      return NextResponse.json({ ok: true, triage: { ...triage, suggested: true, edited: false } });
    } catch {
      return NextResponse.json(
        { ok: false, error: "Could not generate a suggestion right now." },
        { status: 200 } // 200 so the client can show the manual-entry fallback
      );
    }
  }
}

