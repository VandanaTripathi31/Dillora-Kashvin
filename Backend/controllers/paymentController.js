import crypto from "crypto";

import Order from "../models/Order.js";
import { asyncHandler, fail } from "../utils/responseHandler.js";
import { nextOrderId } from "../services/idService.js";
import { issueInvoice } from "../services/invoiceService.js";
import { recordOfferUsage } from "../services/offerService.js";
import { paymentBreakdown } from "./orderController.js";
import {
  getRazorpay,
  isRazorpayConfigured,
  razorpayKeyId,
  razorpayKeySecret,
} from "../config/razorpay.js";

/**
 * POST /api/payment/order
 * Body: { amount }  — amount in rupees (the "pay now" figure).
 * Creates a Razorpay order and returns the details the frontend needs to open
 * Razorpay Checkout. No DB order is created yet — that happens only after the
 * payment signature is verified in /payment/verify.
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    return fail(res, "Online payment is not configured.", 503);
  }

  const rupees = Number(req.body?.amount);
  if (!Number.isFinite(rupees) || rupees <= 0) {
    return fail(res, "A valid payment amount is required.", 400);
  }

  const razorpay = getRazorpay();
  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(rupees * 100), // paise
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  res.status(201).json({
    keyId: razorpayKeyId(),
    orderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
  });
});

/**
 * POST /api/payment/verify
 * Body: {
 *   razorpay_order_id, razorpay_payment_id, razorpay_signature,
 *   order   // the full storefront order payload (customer, items, totals…)
 * }
 * Verifies the HMAC signature. Only if it matches do we persist the real
 * Order (with payment details) and return it.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    return fail(res, "Online payment is not configured.", 503);
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    order,
  } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return fail(res, "Missing payment verification fields.", 400);
  }
  if (!order || typeof order !== "object") {
    return fail(res, "Order details are required.", 400);
  }

  const expected = crypto
    .createHmac("sha256", razorpayKeySecret())
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // Constant-time compare to avoid timing attacks.
  const ok =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

  if (!ok) {
    return fail(res, "Payment verification failed.", 400);
  }

  const id = await nextOrderId();
  const breakdown = paymentBreakdown(order.payment, order.total);
  const created = await Order.create({
    status: "Processing",
    ...order,
    ...breakdown,
    // `payment` (string: "online" / "half-cod") comes from `order` and is kept
    // as-is so the dashboard + order pages keep working. Razorpay specifics go
    // in a dedicated sub-document.
    id,
    createdAt: Date.now(),
    timeline: [{ at: Date.now(), label: breakdown.paymentStatus === "advance-paid" ? "Order placed · 50% advance paid" : "Order placed · paid online", by: "customer" }],
    paymentDetails: {
      provider: "razorpay",
      status: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    },
  });

  // Count promotional-offer redemptions (best-effort).
  recordOfferUsage(created.offers).catch(() => {});

  // Generate + email the invoice for the paid order (best-effort).
  await issueInvoice(created);

  res.status(201).json(created.toJSON());
});
