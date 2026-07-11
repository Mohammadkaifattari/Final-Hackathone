import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ASSET_CONDITIONS } from "./Asset";

const partSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    cost: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const maintenanceSchema = new Schema(
  {
    issue: { type: Schema.Types.ObjectId, ref: "Issue", required: true, index: true },
    technician: { type: Schema.Types.ObjectId, ref: "User", required: true },
    findings: { type: String, required: true, trim: true, maxlength: 4000 },
    workPerformed: { type: String, required: true, trim: true, maxlength: 4000 },
    parts: { type: [partSchema], default: [] },
    cost: { type: Number, required: true, min: 0, default: 0 },
    timeSpent: { type: String, default: "", trim: true },
    evidenceUrls: { type: [String], default: [] },
    finalCondition: { type: String, enum: ASSET_CONDITIONS, default: "Good" },
    completedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export type MaintenanceDoc = InferSchemaType<typeof maintenanceSchema> & {
  _id: mongoose.Types.ObjectId;
  issue: mongoose.Types.ObjectId;
  technician: mongoose.Types.ObjectId;
};

export interface MaintenanceModel extends Model<MaintenanceDoc> {}

export default (mongoose.models.MaintenanceRecord as MaintenanceModel) ||
  mongoose.model<MaintenanceDoc, MaintenanceModel>(
    "MaintenanceRecord",
    maintenanceSchema,
    "maintenance_records"
  );
