import crypto from "crypto";

import Order from "../models/Order.js";
import PendingOrder from "../models/PendingOrder.js";
import { asyncHandler, fail } from "../utils/responseHandler.js";
import { nextOrderId } from "../services/idService.js";
import { issueInvoice } from "../services/invoiceService.js";
import { recordOfferUsage } from "../services/offerService.js";
import { recordCouponUsage } from "../services/couponService.js";
import { computeOrderPricing, sanitizeCustomer, PricingError } from "../services/pricingService.js";
import { reserveStock } from "../services/stockService.js";
import { notifyNewOrder } from "../services/emailService.js";
import { paymentBreakdown } from "./orderController.js";
import {
  getRazorpay,
  isRazorpayConfigured,
  razorpayKeyId,
  razorpayKeySecret,
} from "../config/razorpay.js";

/**
 * POST /api/payment/order
 * Body: { customer, items, payment, coupon }  — the cart, NOT a client amount.
 * The payable amount is recomputed server-side from trusted DB prices. A snapshot
 * of the cart is saved (PendingOrder) so the order can be finalized by either the
 * browser or the webhook. No real Order exists yet — it's created only once the
 * payment is confirmed.
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
    notes: { payment: pricing.payment },
  });

  // Snapshot the cart so the webhook can finalize the order without the browser.
  await PendingOrder.create({
    razorpayOrderId: rzpOrder.id,
    payload: {
      customer: sanitizeCustomer(req.body?.customer),
      items: req.body?.items,
      payment: req.body?.payment,
      coupon: req.body?.coupon,
    },
  });

  res.status(201).json({
    keyId: razorpayKeyId(),
    orderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
  });
});

/**
 * Finalize a paid Razorpay order into a real Order — shared by the browser
 * (/payment/verify) and the webhook. Idempotent: a repeat call for the same
 * payment (or a race between verify and webhook) returns the existing order
 * instead of creating a duplicate. Prices/totals are recomputed from the saved
 * cart snapshot, and the captured amount is re-checked against Razorpay.
 */
async function finalizeOrder({ razorpayOrderId, razorpayPaymentId, razorpaySignature = "" }) {
  // Already finalized for this payment?
  const existingByPayment = await Order.findOne({ "paymentDetails.razorpayPaymentId": razorpayPaymentId });
  if (existingByPayment) return existingByPayment;

  const pending = await PendingOrder.findOne({ razorpayOrderId });
  if (!pending) {
    // The snapshot may have been consumed by the other path (verify/webhook) —
    // if an order already exists for this Razorpay order, return it.
    const byOrder = await Order.findOne({ "paymentDetails.razorpayOrderId": razorpayOrderId });
    if (byOrder) return byOrder;
    throw new PricingError("This payment could not be matched to an order. If money was deducted, contact support.", 409);
  }

  const p = pending.payload || {};
  const pricing = await computeOrderPricing({ items: p.items, payment: p.payment, coupon: p.coupon });

  // Confirm the amount actually captured at Razorpay matches the server figure.
  const razorpay = getRazorpay();
  const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
  const paidPaise = Number(rzpOrder?.amount_paid || 0);
  if (paidPaise !== Math.round(pricing.payNow * 100)) {
    throw new PricingError("The amount paid doesn't match the order. If money was deducted, contact support — it will be refunded.", 400);
  }

  const id = await nextOrderId();
  const breakdown = paymentBreakdown(pricing.payment, pricing.total);
  const customer = sanitizeCustomer(p.customer);

  let created;
  try {
    created = await Order.create({
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
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      },
    });
  } catch (err) {
    // Unique-index race (verify + webhook at once): the other path won — return it.
    if (err?.code === 11000) {
      const dup = await Order.findOne({ "paymentDetails.razorpayPaymentId": razorpayPaymentId });
      if (dup) return dup;
    }
    throw err;
  }

  await PendingOrder.deleteOne({ razorpayOrderId }).catch(() => {});
  await reserveStock(created.items, "order-online");
  recordOfferUsage(created.offers).catch(() => {});
  if (created.coupon?.code) recordCouponUsage(created.coupon.code).catch(() => {});
  notifyNewOrder(created).catch(() => {}); // alert the owner (best-effort)
  await issueInvoice(created);

  return created;
}

/**
 * POST /api/payment/verify  (browser path)
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Verifies the HMAC signature, then finalizes the order from the saved snapshot.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    return fail(res, "Online payment is not configured.", 503);
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return fail(res, "Missing payment verification fields.", 400);
  }

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

  try {
    const order = await finalizeOrder({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });
    return res.status(201).json(order.toJSON());
  } catch (err) {
    if (err instanceof PricingError) return fail(res, err.message, err.status);
    throw err;
  }
});

/**
 * POST /api/payment/webhook  (Razorpay server-to-server)
 * Server-side safety net: if the browser dies after payment capture, Razorpay
 * still calls this and the order is created. Verifies the webhook signature
 * against the RAW body, then finalizes on payment.captured / order.paid.
 * NOTE: mounted with a raw-body parser in server.js (before express.json).
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "Webhook not configured." });

  const signature = String(req.headers["x-razorpay-signature"] || "");
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) return res.status(400).json({ error: "Invalid webhook signature." });

  let event;
  try {
    event = JSON.parse(raw.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Bad payload." });
  }

  if (event?.event === "payment.captured" || event?.event === "order.paid") {
    const pay = event?.payload?.payment?.entity;
    const razorpayOrderId = pay?.order_id || event?.payload?.order?.entity?.id;
    const razorpayPaymentId = pay?.id;
    if (razorpayOrderId && razorpayPaymentId) {
      try {
        await finalizeOrder({ razorpayOrderId, razorpayPaymentId });
      } catch (err) {
        console.error("[webhook] finalize failed:", err.message);
        // Transient errors → 500 so Razorpay retries; permanent (PricingError)
        // → 200 so it stops retrying a request that can never succeed.
        if (!(err instanceof PricingError)) {
          return res.status(500).json({ error: "processing failed" });
        }
      }
    }
  }

  res.json({ received: true });
});
