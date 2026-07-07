import mongoose from "mongoose";

/**
 * Immutable audit trail of every stock change. One document per change, written
 * by the central stock service (services/stockService.js) so admin edits,
 * cancellation restores and any future automated adjustments are all recorded
 * in one consistent place. Never updated — only inserted and read.
 */
const stockLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    productId: { type: String, required: true, index: true },
    productName: { type: String, default: "" },
    oldStock: { type: Number, default: 0 },
    newStock: { type: Number, default: 0 },
    delta: { type: Number, default: 0 }, // newStock - oldStock (signed)
    // Why the change happened: "admin-edit" | "cancellation-restore" | "manual" …
    reason: { type: String, default: "manual" },
    // Who made the change: admin name/email, or "system".
    actor: { type: String, default: "system" },
    createdAt: { type: Number, default: () => Date.now(), index: true },
  },
  {
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        return ret;
      },
    },
  }
);

export default mongoose.model("StockLog", stockLogSchema);
