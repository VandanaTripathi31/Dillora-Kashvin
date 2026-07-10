import mongoose from "mongoose";

// A cart snapshot saved the moment a Razorpay order is created, so the real
// order can be finalized server-side by EITHER the browser (/payment/verify) OR
// Razorpay's webhook — whichever confirms the payment first. This is what stops
// "money captured but no order saved" if the customer's browser dies mid-payment.
// Auto-expires after 24h if the payment never completes.
const pendingOrderSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true },
  // { customer, items, payment, coupon } — re-priced server-side at finalize time.
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 }, // TTL 24h
});

export default mongoose.model("PendingOrder", pendingOrderSchema);
