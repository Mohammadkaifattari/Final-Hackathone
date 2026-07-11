"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import Asset from "@/models/Asset";
import HistoryEvent from "@/models/HistoryEvent";
import { generatePublicId } from "@/lib/public-id";
import { getSession, requireRole } from "@/lib/session";
import { can } from "@/lib/business-rules";
import { formatIssueNumber } from "@/lib/format";

function zodError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    // Mongoose duplicate-key
    const code = (err as { code?: number }).code;
    if (code === 11000) return "An asset with that asset code already exists.";
  }
  return "Could not save the asset. Please try again.";
}

export interface CreateAssetInput {
  name: string;
  assetCode: string;
  category: string;
  location: string;
  condition: string;
  assignedTechnicianId?: string | null;
}

export async function createAssetAction(input: CreateAssetInput) {
  const user = await requireRole(["admin", "supervisor", "technician"]);

  const name = input.name?.trim();
  const assetCode = input.assetCode?.trim().toUpperCase();
  const location = input.location?.trim();

  if (!name || !assetCode || !location) {
    return { ok: false, error: "Name, asset code, and location are required." };
  }

  await connectDB();

  // Reject duplicate assetCode with a clear error (Section 4 business rule).
  const dup = await Asset.exists({ assetCode });
  if (dup) {
    return { ok: false, error: `An asset with code “${assetCode}” already exists.` };
  }

  const publicId = await generatePublicId(name, assetCode);

  try {
    const asset = await Asset.create({
      name,
      assetCode,
      category: input.category?.trim() || "Other",
      location,
      condition: (input.condition || "Good") as any,
      status: "Operational",
      assignedTechnician: (input.assignedTechnicianId || null) as any,
      publicId,
      createdBy: user.id,
    });

    await HistoryEvent.log({
      asset: asset._id,
      actor: user.name,
      actorRef: user.id,
      action: "Asset registered and QR sticker generated",
      meta: { assetCode, publicId },
    });

    revalidatePath("/console");
    revalidatePath("/console/assets");
    revalidatePath(`/asset/${publicId}`);
    return { ok: true, id: String(asset._id), publicId };
  } catch (err) {
    return { ok: false, error: zodError(err) };
  }
}

export interface UpdateAssetInput {
  id: string;
  name?: string;
  category?: string;
  location?: string;
  condition?: string;
  status?: string;
  assignedTechnicianId?: string | null;
  lastServiceDate?: string | null;
  nextServiceDate?: string | null;
}

export async function updateAssetAction(input: UpdateAssetInput) {
  const session = await getSession();
  if (!session || !can(session.user.role, "manageAssets")) {
    return { ok: false, error: "You don’t have permission to edit assets." };
  }

  await connectDB();
  const asset = await Asset.findById(input.id);
  if (!asset) return { ok: false, error: "Asset not found." };

  // publicId and assetCode are IMMUTABLE after creation (QR stability).
  const prev = {
    name: asset.name,
    location: asset.location,
    status: asset.status,
    assignedTechnician: asset.assignedTechnician,
  };

  if (input.name) asset.name = input.name.trim();
  if (input.category) asset.category = input.category.trim();
  if (input.location) asset.location = input.location.trim();
  if (input.condition) asset.condition = input.condition as any;
  // Status is normally driven by issue lifecycle; allow admin override but log it.
  if (input.status && input.status !== prev.status) asset.status = input.status as any;
  if (input.assignedTechnicianId !== undefined) {
    asset.assignedTechnician = (input.assignedTechnicianId || null) as any;
  }
  if (input.lastServiceDate !== undefined) asset.lastServiceDate = (input.lastServiceDate ? new Date(input.lastServiceDate) : null) as any;
  if (input.nextServiceDate !== undefined) {
    asset.nextServiceDate = (input.nextServiceDate ? new Date(input.nextServiceDate) : null) as any;
  }

  // nextServiceDate cannot be earlier than the maintenance completion date
  // (here: lastServiceDate is the best proxy when set).
  if (
    asset.nextServiceDate &&
    asset.lastServiceDate &&
    new Date(asset.nextServiceDate) < new Date(asset.lastServiceDate)
  ) {
    return { ok: false, error: "Next service date cannot be earlier than the last service date." };
  }

  try {
    await asset.save();

    if (prev.name !== asset.name || prev.location !== asset.location) {
      await HistoryEvent.log({
        asset: asset._id,
        actor: session.user.name,
        actorRef: session.user.id,
        action: "Asset details updated",
        meta: { from: prev, to: { name: asset.name, location: asset.location } },
      });
    }
    if (String(prev.assignedTechnician) !== String(asset.assignedTechnician ?? "")) {
      await HistoryEvent.log({
        asset: asset._id,
        actor: session.user.name,
        actorRef: session.user.id,
        action: `Assigned technician ${asset.assignedTechnician ? "updated" : "cleared"}`,
      });
    }
    if (prev.status !== asset.status) {
      await HistoryEvent.log({
        asset: asset._id,
        actor: session.user.name,
        actorRef: session.user.id,
        action: `Asset status set to ${asset.status} (manual override)`,
      });
    }

    revalidatePath("/console");
    revalidatePath("/console/assets");
    revalidatePath(`/console/assets/${asset.id}`);
    revalidatePath(`/asset/${asset.publicId}`);
    return { ok: true, id: String(asset._id) };
  } catch (err) {
    return { ok: false, error: zodError(err) };
  }
}

export async function deleteAssetAction(id: string) {
  const session = await getSession();
  if (!session || !can(session.user.role, "manageAssets")) {
    return { ok: false, error: "You don’t have permission to delete assets." };
  }
  await connectDB();
  const asset = await Asset.findById(id);
  if (!asset) return { ok: false, error: "Asset not found." };

  await HistoryEvent.log({
    asset: asset._id,
    actor: session.user.name,
    actorRef: session.user.id,
    action: "Asset deleted",
  });
  await asset.deleteOne();

  revalidatePath("/console");
  revalidatePath("/console/assets");
  return { ok: true };
}

// Re-export for the form module to compute preview numbers.
export { formatIssueNumber };
