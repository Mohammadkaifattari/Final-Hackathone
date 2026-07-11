import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const ISSUE_STATUSES = [
  "Reported",
  "Assigned",
  "Inspection Started",
  "Maintenance In Progress",
  "Waiting for Parts",
  "Resolved",
  "Closed",
  "Reopened",
] as const;

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;

const aiSchema = new Schema(
  {
    suggested: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    possibleCauses: { type: [String], default: [] },
    initialChecks: { type: [String], default: [] },
    recurringWarning: { type: String, default: null },
  },
  { _id: false }
);

const issueSchema = new Schema(
  {
    issueNumber: { type: String, required: true, unique: true, index: true, uppercase: true },
    asset: { type: Schema.Types.ObjectId, ref: "Asset", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: String, required: true, trim: true, default: "Other" },
    priority: { type: String, enum: PRIORITIES, default: "medium", index: true },
    status: { type: String, enum: ISSUE_STATUSES, default: "Reported", index: true },
    reporterName: { type: String, default: "Anonymous Reporter", trim: true },
    reporterContact: { type: String, default: "", trim: true },
    evidenceUrls: { type: [String], default: [] },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    ai: { type: aiSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Compound index for the dashboard / issue list (newest first by status).
issueSchema.index({ status: 1, createdAt: -1 });

export type IssueDoc = InferSchemaType<typeof issueSchema> & {
  _id: mongoose.Types.ObjectId;
  asset: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId | null;
};

export interface IssueModel extends Model<IssueDoc> {}

export default (mongoose.models.Issue as IssueModel) ||
  mongoose.model<IssueDoc, IssueModel>("Issue", issueSchema, "issues");
