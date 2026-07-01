import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["flat", "percent", "bogo"], default: "percent" },
    value: { type: Number, default: 0 },
    buyQty: { type: Number, default: 1 },
    freeQty: { type: Number, default: 1 },
    minOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    expiry: { type: String, default: "" }, // YYYY-MM-DD (string, matches storefront)
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

export default mongoose.model("Coupon", couponSchema);
