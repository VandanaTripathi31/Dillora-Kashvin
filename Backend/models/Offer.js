import mongoose from "mongoose";

/**
 * A dynamic promotional offer that auto-applies at the cart/checkout based on
 * its rules — no coupon code needed (that's the separate Coupon model). Example:
 * "Buy 2 Mobile Covers → get 1 Charm free".
 *
 *  buy  = the trigger condition (how many of a category/product must be in cart)
 *  reward = what the customer gets:
 *     - "free"    : `qty` cheapest items matching the reward scope become free
 *     - "percent" : `value`% off the matching items' subtotal
 *     - "flat"    : flat `value` off (capped at the matching subtotal)
 */
const offerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
    priority: { type: Number, default: 0 }, // higher = evaluated first

    // Validity window (YYYY-MM-DD strings; empty = open-ended).
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },

    // Trigger: need `qty` items matching scope+ref in the cart.
    buy: {
      scope: { type: String, enum: ["category", "product"], default: "category" },
      ref: { type: String, default: "" }, // category id or product id
      qty: { type: Number, default: 2 },
    },

    // Reward.
    reward: {
      type: { type: String, enum: ["free", "percent", "flat"], default: "free" },
      scope: { type: String, enum: ["category", "product"], default: "category" },
      ref: { type: String, default: "" },
      qty: { type: Number, default: 1 }, // free items per application
      value: { type: Number, default: 0 }, // percent or flat amount
    },

    usageLimit: { type: Number, default: 0 }, // 0 = unlimited (total redemptions)
    usageCount: { type: Number, default: 0 },
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

export default mongoose.model("Offer", offerSchema);
