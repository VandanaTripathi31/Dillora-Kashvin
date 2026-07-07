import mongoose from "mongoose";

/**
 * Atomic sequence counter. One document per logical sequence (keyed by `_id`,
 * e.g. "order-20260706"). `findOneAndUpdate` with `$inc` is atomic at the
 * MongoDB level, so concurrent requests can never receive the same value —
 * this is what makes generated ids (order numbers, etc.) collision-proof even
 * under load or after documents are deleted.
 */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const Counter = mongoose.model("Counter", counterSchema);

/**
 * Atomically increment the named sequence and return the new value.
 * @param {string} key - unique sequence name.
 * @returns {Promise<number>} the next value (starts at 1).
 */
export async function nextSeq(key) {
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );
  return doc.seq;
}

export default Counter;
