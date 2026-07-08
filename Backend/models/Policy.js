import mongoose from "mongoose";

// A titled group of policy clauses (e.g. "Shipping & Delivery" with 3 lines).
const sectionSchema = new mongoose.Schema(
  {
    heading: { type: String, default: "" },
    clauses: { type: [String], default: [] },
  },
  { _id: false }
);

/**
 * Shipping & Return policy content, structured per category so the storefront
 * product page can render it in an accordion. `category` is a category id
 * (e.g. "mobile-covers") or "general" — the store-wide fallback used when a
 * category has no policy of its own. Fully admin-editable (DB-backed) so wording
 * changes never need a redeploy.
 */
const policySchema = new mongoose.Schema(
  {
    category: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: "Shipping & Return Policy" },
    sections: { type: [sectionSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model("Policy", policySchema);
