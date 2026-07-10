import crypto from "crypto";

import Order from "../models/Order.js";
import { asyncHandler, fail } from "../utils/responseHandler.js";
import { nextOrderId } from "../services/idService.js";
import { issueInvoice } from "../services/invoiceService.js";
import { recordOfferUsage } from "../services/offerService.js";
import { recordCouponUsage } from "../services/couponService.js";
import { computeOrderPricing, sanitizeCustomer, PricingError } from "../services/pricingService.js";
import { reserveStock } from "../services/stockService.js";
import { paymentBreakdown } from "./orderController.js";
import {
  getRazorpay,
  isRazorpayConfigured,
  razorpayKeyId,
  razorpayKeySecret,
} from "../config/razorpay.js";

/**
 * POST /api/payment/order
 * Body: { items, payment, coupon }  — the cart, NOT a client-chosen amount.
 * The payable amount is recomputed server-side from trusted DB prices, so a
 * client can't create a ₹1 Razorpay order for a ₹10,000 cart. No DB order is
 * created yet — that happens only after the signature + amount are verified.
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    return fail(res, "Online payment is not configured.", 503);
  }

  let pricing;
  try {
    pricing = await computeOrderPricing({
      items: req.body?.items,
      payment: req.body?.payment,
      coupon: req.body?.coupon,
    });
  } catch (err) {
    if (err instanceof PricingError) return fail(res, err.message, err.status);
    throw err;
  }

  if (!(pricing.payNow > 0)) {
    return fail(res, "This order has nothing to pay online.", 400);
  }

  const razorpay = getRazorpay();
  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(pricing.payNow * 100), // paise — server-computed
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
    notes: { payNow: String(pricing.payNow), payment: pricing.payment },
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
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, order }
 * Verifies (1) the HMAC signature, (2) that the amount actually captured at
 * Razorpay equals the server-recomputed payable amount, then persists the order
 * built entirely from trusted server values (client prices/totals/status are
 * ignored). Idempotent: a repeated verify for the same payment returns the
 * already-created order instead of a duplicate.
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

  // 1. Signature — constant-time compare to avoid timing attacks.
  const expected = crypto
    .createHmac("sha256", razorpayKeySecret())
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  const ok =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  if (!ok) {
    return fail(res, "Payment verification failed.", 400);
  }

  // 2. Idempotency — if this payment already produced an order, return it.
  const existing = await Order.findOne({ "paymentDetails.razorpayPaymentId": razorpay_payment_id });
  if (existing) return res.status(200).json(existing.toJSON());

  // 3. Recompute the authoritative pricing from the DB (never trust the client).
  let pricing;
  try {
    pricing = await computeOrderPricing({ items: order.items, payment: order.payment, coupon: order.coupon });
  } catch (err) {
    if (err instanceof PricingError) return fail(res, err.message, err.status);
    throw err;
  }

  // 4. Confirm the amount actually captured at Razorpay matches the server figure.
  const razorpay = getRazorpay();
  const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
  const paidPaise = Number(rzpOrder?.amount_paid || 0);
  const expectedPaise = Math.round(pricing.payNow * 100);
  if (paidPaise !== expectedPaise) {
    return fail(res, "The amount paid doesn't match your order. If money was deducted, contact support — it will be refunded.", 400);
  }

  // 5. Build the order from SERVER-computed values + whitelisted customer fields.
  const id = await nextOrderId();
  const breakdown = paymentBreakdown(pricing.payment, pricing.total);
  const customer = sanitizeCustomer(order.customer);
  const created = await Order.create({
    id,
    createdAt: Date.now(),
    status: "Processing",
    customer,
    userPhone: customer.phone,
    items: pricing.items,
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    total: pricing.total,
    coupon: pricing.coupon,
    offers: pricing.offers,
    offerDiscount: pricing.offerDiscount,
    payment: pricing.payment,
    ...breakdown,
    timeline: [
      {
        at: Date.now(),
        label: breakdown.paymentStatus === "advance-paid" ? "Order placed · 50% advance paid" : "Order placed · paid online",
        by: "customer",
      },
    ],
    paymentDetails: {
      provider: "razorpay",
      status: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    },
  });

  // 6. Decrement tracked stock (best-effort), then usage counters + invoice.
  await reserveStock(created.items, "order-online");
  recordOfferUsage(created.offers).catch(() => {});
  if (created.coupon?.code) recordCouponUsage(created.coupon.code).catch(() => {});
  await issueInvoice(created);

  res.status(201).json(created.toJSON());
});
