import mongoose from "mongoose";

// A single settings document holds site-wide config (banner, discounts…).
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true },
    banner: {
      on: { type: Boolean, default: false },
      preset: { type: String, default: "diwali" },
      text: { type: String, default: "" },
      code: { type: String, default: "" },
    },
    showDiscounts: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.key;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

export default mongoose.model("Setting", settingSchema);
