import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  { name: String, price: Number },
  { _id: false }
);

// An admin-managed colour variant for a product (T-shirts, crochet, etc.).
// `hex` drives the swatch; `image` is an optional swatch/preview image URL.
const colorOptionSchema = new mongoose.Schema(
  { name: { type: String, required: true }, hex: { type: String, default: "" }, image: { type: String, default: "" } },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // Public string id, e.g. "p1". Auto-generated on create if not supplied.
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true }, // category.id
    sub: { type: String, default: "", index: true }, // sub.id
    price: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    optionType: {
      type: String,
      enum: ["none", "phone", "size", "resin"],
      default: "none",
    },
    image: { type: String, default: "" },
    gallery: { type: [String], default: undefined },
    materials: { type: [materialSchema], default: undefined },
    sizes: { type: [String], default: undefined },
    colorOptions: { type: [colorOptionSchema], default: undefined },
    // Admin-managed cross-sell: product ids to show under "Pair it with" (covers)
    // or "You may also like" (everything else). Empty → sensible auto-fallback.
    relatedIds: { type: [String], default: undefined },
    imagePublicId: { type: String, default: undefined }, // Cloudinary public_id
    // Stock lock: when locked, only owner/manager admins or the assigned editor
    // may edit this product. Prevents normal staff from touching protected items.
    stockLock: {
      locked: { type: Boolean, default: false },
      editorEmail: { type: String, default: "" }, // an admin's email who may edit despite the lock
      lockedBy: { type: String, default: "" },
      lockedAt: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        // Drop empty optional arrays so the shape matches the original catalog.
        if (ret.gallery == null) delete ret.gallery;
        if (ret.materials == null) delete ret.materials;
        if (ret.sizes == null) delete ret.sizes;
        if (ret.colorOptions == null) delete ret.colorOptions;
        if (ret.relatedIds == null) delete ret.relatedIds;
        if (ret.imagePublicId == null) delete ret.imagePublicId;
        return ret;
      },
    },
  }
);

export default mongoose.model("Product", productSchema);
