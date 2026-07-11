import mongoose, { Schema, type Model } from "mongoose";

/**
 * Atomic sequence counter for human-readable IDs (issueNumber: ISS-0001).
 * `findAndIncrement` is atomic via findOneAndUpdate with $inc + upsert,
 * so concurrent issue reports can never collide.
 */
export interface ICounter {
  _id: string;
  seq: number;
}

interface CounterModel extends Model<ICounter> {
  findAndIncrement(key: string): Promise<number>;
}

const counterSchema = new Schema<ICounter, CounterModel>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.static(
  "findAndIncrement",
  async function (this: Model<ICounter>, key: string): Promise<number> {
    const doc = await this.findByIdAndUpdate(
      key,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return doc?.seq ?? 0;
  }
);

export default (mongoose.models.Counter as unknown as CounterModel) ||
  mongoose.model<ICounter, CounterModel>("Counter", counterSchema, "counters");
