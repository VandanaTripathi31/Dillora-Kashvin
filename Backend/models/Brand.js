import mongoose from "mongoose";

// A single phone model under a brand (e.g. "iPhone 15 Pro" under "Apple").
const phoneModelSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * Phone brand + its models, admin-managed so the storefront's cover-ordering
 * dropdowns (brand → model) stay current without code changes. Mirrors the
 * Category/subs shape already used elsewhere. `active` hides a brand/model from
 * the storefront without deleting it; `order` controls display order.
 */
const brandSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    models: { type: [phoneModelSchema], default: [] },
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

export default mongoose.model("Brand", brandSchema);
