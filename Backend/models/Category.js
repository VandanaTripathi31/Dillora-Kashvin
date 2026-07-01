import mongoose from "mongoose";

const subSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    custom: { type: Boolean, default: false },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    // Public string id, e.g. "mobile-covers" (matches the storefront routes).
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: "" },
    order: { type: Number, default: 0 },
    subs: { type: [subSchema], default: [] },
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

export default mongoose.model("Category", categorySchema);
