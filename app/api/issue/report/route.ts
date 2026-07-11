import { NextResponse } from "next/server";
import { z } from "zod";
import { reportIssueAction } from "@/app/actions/issues";
import { PRIORITIES } from "@/lib/business-rules";

const AiSchema = z.object({
  suggested: z.boolean().optional(),
  edited: z.boolean().optional(),
  rejectedAI: z.boolean().optional(),
  possibleCauses: z.array(z.string().trim()).optional(),
  initialChecks: z.array(z.string().trim()).optional(),
  recurringWarning: z.string().trim().optional(),
});

const ReportSchema = z
  .object({
    publicId: z.string().trim().min(1).optional(),
    assetPublicId: z.string().trim().min(1).optional(),
    description: z.string().trim().min(3).optional(),
    complaint: z.string().trim().min(3).optional(),
    title: z.string().trim().max(160).optional(),
    category: z.string().trim().optional(),
    priority: z.enum(PRIORITIES).optional(),
    reporterName: z.string().trim().optional(),
    reporterContact: z.string().trim().optional(),
    evidenceUrls: z.array(z.string().url()).max(6).optional(),
    ai: AiSchema.optional(),
    // legacy shape from earlier iterations
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
  })
  .refine((d) => !!(d.publicId || d.assetPublicId), { message: "Asset ID is required." })
  .refine((d) => !!(d.description || d.complaint), { message: "Please describe the issue in a few words." });

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

  const data = parsed.data;
  const assetPublicId = data.publicId ?? data.assetPublicId!;
  const complaint = data.description ?? data.complaint!;
  const legacy = data.triage;

  const aiInput = data.ai;
  const ai = aiInput
    ? {
        suggested: aiInput.rejectedAI ? false : (aiInput.suggested ?? false),
        edited: aiInput.rejectedAI ? false : (aiInput.edited ?? false),
        possibleCauses: (aiInput.possibleCauses ?? []).filter(Boolean),
        initialChecks: (aiInput.initialChecks ?? []).filter(Boolean),
        recurringWarning: aiInput.recurringWarning,
      }
    : legacy
      ? {
          suggested: true,
          edited: !!legacy.edited,
          possibleCauses: (legacy.causes ?? []).filter(Boolean),
          initialChecks: (legacy.checks ?? []).filter(Boolean),
        }
      : undefined;

  const result = await reportIssueAction({
    assetPublicId,
    complaint,
    reporterName: data.reporterName,
    reporterContact: data.reporterContact,
    evidenceUrls: data.evidenceUrls,
    title: data.title ?? legacy?.title,
    category: data.category ?? legacy?.category,
    priority: data.priority ?? legacy?.priority,
    ai,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, issueId: result.issueId, issueNumber: result.issueNumber });
}
