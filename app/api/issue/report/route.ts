import { NextResponse } from "next/server";
import { z } from "zod";
import { mockTriage } from "@/lib/mock-triage";
import { reportIssueAction } from "@/app/actions/issues";
import { PRIORITIES } from "@/lib/business-rules";

const ReportSchema = z.object({
  assetPublicId: z.string().trim().min(1),
  complaint: z.string().trim().min(3, "Please describe the issue in a few words."),
  reporterName: z.string().trim().optional(),
  reporterContact: z.string().trim().optional(),
  evidenceUrls: z.array(z.string().url()).max(6).optional(),
  // optional triage the reporter reviewed/edited
  triage: z
    .object({
      title: z.string().trim().max(160).optional(),
      category: z.string().trim().optional(),
      priority: z.enum(PRIORITIES).optional(),
      causes: z.array(z.string().trim()).optional(),
      checks: z.array(z.string().trim()).optional(),
      edited: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = ReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  // Run AI triage (mock now, real AI Gateway in Phase 4) — advisory only.
  const triage = await mockTriage({
    complaint: parsed.data.complaint,
    assetName: parsed.data.assetPublicId,
    assetCategory: parsed.data.triage?.category ?? "Other",
  });

  // Merge any reporter edits over the suggestion.
  const reporterOverrides = parsed.data.triage;
  const ai = {
    suggested: true,
    edited: !!reporterOverrides?.edited,
    possibleCauses: (reporterOverrides?.causes ?? triage.possibleCauses).filter(Boolean),
    initialChecks: (reporterOverrides?.checks ?? triage.initialChecks).filter(Boolean),
    recurringWarning: triage.recurringWarning,
  };

  const result = await reportIssueAction({
    assetPublicId: parsed.data.assetPublicId,
    complaint: parsed.data.complaint,
    reporterName: parsed.data.reporterName,
    reporterContact: parsed.data.reporterContact,
    evidenceUrls: parsed.data.evidenceUrls,
    title: reporterOverrides?.title ?? triage.title,
    category: reporterOverrides?.category ?? triage.category,
    priority: reporterOverrides?.priority ?? triage.priority,
    ai,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, issueId: result.issueId, issueNumber: result.issueNumber, triage });
}
