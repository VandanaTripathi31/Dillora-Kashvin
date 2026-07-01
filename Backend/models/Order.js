import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: String,
    name: String,
    category: String,
    options: String,
    qty: Number,
    price: Number,
    image: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Public human-friendly id, e.g. "DIL-1043".
    id: { type: String, required: true, unique: true },
    customer: {
      name: String,
      phone: { type: String, index: true },
      address: String,
    },
    userPhone: { type: String, index: true },
    items: { type: [orderItemSchema], default: [] },
    subtotal: Number,
    discount: Number,
    total: Number,
    coupon: { type: mongoose.Schema.Types.Mixed, default: undefined },
    payment: { type: String, default: "online" },
    status: { type: String, default: "Processing" },
    // Stored as a numeric ms timestamp to match the storefront's shape.
    createdAt: { type: Number, default: () => Date.now() },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        if (ret.coupon == null) delete ret.coupon;
        return ret;
      },
    },
  }
);

export default mongoose.model("Order", orderSchema);
