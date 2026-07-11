import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * APPEND-ONLY audit trail. Never update or delete events in normal flows.
 * The schema has no update/delete helpers on purpose — callers use `log()`.
 */
const historySchema = new Schema(
  {
    asset: { type: Schema.Types.ObjectId, ref: "Asset", required: true, index: true },
    actor: { type: String, required: true }, // user name OR "Anonymous Reporter"
    actorRef: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true, trim: true, maxlength: 400 },
    relatedIssue: { type: Schema.Types.ObjectId, ref: "Issue", default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

// Timeline queries: newest-first per asset.
historySchema.index({ asset: 1, createdAt: -1 });

export type HistoryDoc = InferSchemaType<typeof historySchema> & {
  _id: mongoose.Types.ObjectId;
  asset: mongoose.Types.ObjectId;
};

export interface HistoryModel extends Model<HistoryDoc> {
  /** Append a single history event (the only sanctioned write method). */
  log(input: {
    asset: mongoose.Types.ObjectId | string;
    actor: string;
    actorRef?: mongoose.Types.ObjectId | string | null;
    action: string;
    relatedIssue?: mongoose.Types.ObjectId | string | null;
    meta?: Record<string, unknown>;
  }): Promise<HistoryDoc>;
}

historySchema.static("log", async function (input: Parameters<HistoryModel["log"]>[0]) {
  return this.create({
    asset: input.asset,
    actor: input.actor,
    actorRef: input.actorRef ?? null,
    action: input.action,
    relatedIssue: input.relatedIssue ?? null,
    meta: input.meta ?? {},
  });
});

export default (mongoose.models.HistoryEvent as HistoryModel) ||
  mongoose.model<HistoryDoc, HistoryModel>("HistoryEvent", historySchema, "history_events");
