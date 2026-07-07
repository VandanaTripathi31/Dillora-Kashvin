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

// A single event in the order's history (placed, status change, cancellation…).
const timelineSchema = new mongoose.Schema(
  {
    at: { type: Number, default: () => Date.now() },
    label: String,
    by: { type: String, default: "" }, // "customer", admin name, or "system"
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Public human-friendly id, e.g. "DK202607060001" (legacy: "DIL-1043").
    id: { type: String, required: true, unique: true },
    customer: {
      name: String,
      phone: { type: String, index: true },
      email: { type: String, default: "" }, // optional — used to email the invoice
      address: String,
    },
    userPhone: { type: String, index: true },
    items: { type: [orderItemSchema], default: [] },
    subtotal: Number,
    discount: Number,
    total: Number,
    coupon: { type: mongoose.Schema.Types.Mixed, default: undefined },
    // Auto-applied promotional offers (separate from coupon codes).
    offers: {
      type: [
        new mongoose.Schema(
          { id: String, name: String, discount: Number },
          { _id: false }
        ),
      ],
      default: [],
    },
    offerDiscount: { type: Number, default: 0 },
    payment: { type: String, default: "online" },
    // Advance-payment breakdown (for customized / half-COD orders): how much was
    // paid upfront, how much is due on delivery, and the overall payment status.
    advancePaid: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["paid", "advance-paid", "pending"],
      default: "paid",
    },
    // Razorpay (or other gateway) specifics — only set for verified online payments.
    paymentDetails: {
      provider: String,
      status: String,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
    },
    status: { type: String, default: "Processing" },
    // Cancellation workflow (mobile covers, within 48h). Customer requests →
    // admin approves/rejects. On approval stock is restored and status → Cancelled.
    cancellation: {
      state: {
        type: String,
        enum: ["none", "requested", "approved", "rejected"],
        default: "none",
      },
      reason: { type: String, default: "" },
      requestedAt: { type: Number, default: 0 },
      decidedAt: { type: Number, default: 0 },
      decidedBy: { type: String, default: "" },
      // Manual refund tracking — admin updates this; actual refund is done in
      // the payment gateway dashboard.
      refundStatus: {
        type: String,
        enum: ["none", "pending", "refunded", "not-applicable"],
        default: "none",
      },
    },
    timeline: { type: [timelineSchema], default: [] },
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
