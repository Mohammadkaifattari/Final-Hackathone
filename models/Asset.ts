import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const ASSET_STATUSES = [
  "Operational",
  "Issue Reported",
  "Under Inspection",
  "Under Maintenance",
  "Out of Service",
  "Retired",
] as const;

export const ASSET_CONDITIONS = ["Excellent", "Good", "Fair", "Poor"] as const;

const assetSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    assetCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      minlength: 1,
      maxlength: 60,
    },
    category: { type: String, required: true, trim: true, default: "Other" },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    condition: { type: String, enum: ASSET_CONDITIONS, default: "Good" },
    status: { type: String, enum: ASSET_STATUSES, default: "Operational", index: true },
    lastServiceDate: { type: Date, default: null },
    nextServiceDate: { type: Date, default: null },
    assignedTechnician: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    // Stable slug used in the QR URL — generated ONCE, never changes.
    publicId: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Help find-by-publicId lookups (the QR landing path) stay fast.
assetSchema.index({ publicId: 1 });

export type AssetDoc = InferSchemaType<typeof assetSchema> & {
  _id: mongoose.Types.ObjectId;
  assignedTechnician?: mongoose.Types.ObjectId | null;
  createdBy?: mongoose.Types.ObjectId | null;
};

export interface AssetModel extends Model<AssetDoc> {}

export default (mongoose.models.Asset as AssetModel) ||
  mongoose.model<AssetDoc, AssetModel>("Asset", assetSchema, "assets");
