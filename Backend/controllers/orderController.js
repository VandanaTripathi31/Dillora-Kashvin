import Order from "../models/Order.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { nextOrderId } from "../services/idService.js";
import { issueInvoice } from "../services/invoiceService.js";
import { adjustStock } from "../services/stockService.js";
import { notifyOps, esc } from "../services/emailService.js";
import { recordOfferUsage } from "../services/offerService.js";
import { recordCouponUsage } from "../services/couponService.js";

// Only mobile covers are cancellable, and only within this window.
const CANCEL_CATEGORY = "mobile-covers";
const CANCEL_WINDOW_MS = 48 * 60 * 60 * 1000;

const coverItems = (order) =>
  (order.items || []).filter((i) => i.category === CANCEL_CATEGORY);

/** Whether an order may currently be cancelled, with a human-readable reason. */
function cancelEligibility(order) {
  const state = order.cancellation?.state;
  if (state === "requested") return { ok: false, reason: "A cancellation request is already pending." };
  if (state === "approved" || order.status === "Cancelled") return { ok: false, reason: "This order is already cancelled." };
  if (!coverItems(order).length) return { ok: false, reason: "Only mobile cover orders can be cancelled." };
  const age = Date.now() - (order.createdAt || 0);
  if (age > CANCEL_WINDOW_MS) return { ok: false, reason: "The 48-hour cancellation window has passed." };
  return { ok: true };
}

const pushTimeline = (order, label, by = "system") =>
  order.timeline.push({ at: Date.now(), label, by });

/**
 * Compute the advance/pending/status split for an order. Half-COD (used for
 * customized products) pays 50% upfront; the balance is due on delivery.
 * Everything else is fully prepaid. Computed server-side from `total`.
 */
export function paymentBreakdown(payment, total) {
  const t = Number(total) || 0;
  if (payment === "half-cod") {
    const advancePaid = Math.round(t / 2);
    return { advancePaid, pendingAmount: t - advancePaid, paymentStatus: "advance-paid" };
  }
  if (payment === "cod") {
    // Full cash on delivery — nothing collected online, the whole amount is due
    // on delivery. Restricted to mobile-cover-only carts (see createOrder).
    return { advancePaid: 0, pendingAmount: t, paymentStatus: "pending" };
  }
  return { advancePaid: t, pendingAmount: 0, paymentStatus: "paid" };
}

/** Whether every line item in an order is a mobile cover. */
const isCoversOnly = (items) =>
  Array.isArray(items) && items.length > 0 && items.every((i) => i.category === CANCEL_CATEGORY);

// GET /api/orders  (protected — admin)
export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders.map((o) => o.toJSON()));
});

// GET /api/orders/by-phone/:phone
export const getOrdersByPhone = asyncHandler(async (req, res) => {
  const phone = req.params.phone;
  const orders = await Order.find({
    $or: [{ "customer.phone": phone }, { userPhone: phone }],
  }).sort({ createdAt: -1 });
  res.json(orders.map((o) => o.toJSON()));
});

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  // Full COD is allowed only for mobile-cover-only carts (standard stock).
  // Handmade / made-to-order items require an online or advance payment.
  // Enforced here so the storefront rule can't be bypassed by a crafted request.
  if (req.body?.payment === "cod" && !isCoversOnly(req.body?.items)) {
    return res.status(400).json({ error: "Cash on delivery is available only for mobile cover orders." });
  }
  const id = await nextOrderId();
  const breakdown = paymentBreakdown(req.body?.payment, req.body?.total);
  const order = await Order.create({
    status: "Processing",
    ...req.body,
    ...breakdown,
    id,
    createdAt: Date.now(),
    timeline: [{ at: Date.now(), label: "Order placed", by: "customer" }],
  });

  // Count promotional-offer + coupon redemptions (best-effort).
  recordOfferUsage(order.offers).catch(() => {});
  if (order.coupon?.code) recordCouponUsage(order.coupon.code).catch(() => {});

  // Generate + email the invoice (best-effort; never blocks the response).
  await issueInvoice(order);

  res.status(201).json(order.toJSON());
});

// PUT /api/orders/:id/status  { status }
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) return res.status(404).json({ error: "Order not found." });
  const next = req.body.status;
  if (next && next !== order.status) {
    order.status = next;
    const by = req.admin?.name || req.admin?.email || "admin";
    pushTimeline(order, `Status → ${next}`, by);
  }
  await order.save();
  res.json(order.toJSON());
});

// POST /api/orders/:id/cancel  { phone, reason }   (public — customer request)
export const requestCancellation = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) return res.status(404).json({ error: "Order not found." });

  // Verify the requester owns the order (storefront has no login — match phone).
  const phone = String(req.body?.phone || "").trim();
  const owns = phone && (order.customer?.phone === phone || order.userPhone === phone);
  if (!owns) return res.status(403).json({ error: "Phone number does not match this order." });

  const elig = cancelEligibility(order);
  if (!elig.ok) return res.status(400).json({ error: elig.reason });

  const reason = String(req.body?.reason || "").trim().slice(0, 500);
  order.cancellation.state = "requested";
  order.cancellation.reason = reason;
  order.cancellation.requestedAt = Date.now();
  pushTimeline(order, "Cancellation requested", "customer");
  await order.save();

  // Notify ops (best-effort).
  notifyOps({
    subject: `Cancellation requested: ${order.id}`,
    title: "Cancellation request",
    bodyHtml: `
      <p><b>${esc(order.customer?.name || "A customer")}</b> requested to cancel order <b>${esc(order.id)}</b>.</p>
      <p><b>Phone:</b> ${esc(order.customer?.phone || phone)}<br/>
      <b>Reason:</b> ${esc(reason || "—")}</p>
      <p>Review it in the dashboard to approve or reject.</p>`,
  }).catch(() => {});

  res.json(order.toJSON());
});

// PUT /api/orders/:id/cancellation  { action: 'approve'|'reject' }   (admin)
export const decideCancellation = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (order.cancellation?.state !== "requested") {
    return res.status(400).json({ error: "No pending cancellation request on this order." });
  }

  const action = req.body?.action;
  const by = req.admin?.name || req.admin?.email || "admin";

  if (action === "approve") {
    // Restore stock for the mobile-cover line items (best-effort, audited).
    for (const it of coverItems(order)) {
      if (!it.productId || !it.qty) continue;
      try {
        await adjustStock({
          productId: it.productId,
          delta: Number(it.qty) || 0,
          reason: "cancellation-restore",
          actor: by,
        });
      } catch (err) {
        console.error(`[cancel] stock restore failed for ${it.productId}:`, err.message);
      }
    }
    order.cancellation.state = "approved";
    order.cancellation.decidedAt = Date.now();
    order.cancellation.decidedBy = by;
    order.cancellation.refundStatus = order.payment === "online" || order.payment === "half-cod" ? "pending" : "not-applicable";
    order.status = "Cancelled";
    pushTimeline(order, "Cancellation approved · stock restored", by);
  } else if (action === "reject") {
    order.cancellation.state = "rejected";
    order.cancellation.decidedAt = Date.now();
    order.cancellation.decidedBy = by;
    pushTimeline(order, "Cancellation rejected", by);
  } else {
    return res.status(400).json({ error: "action must be 'approve' or 'reject'." });
  }

  await order.save();
  res.json(order.toJSON());
});

// PUT /api/orders/:id/collect-balance   (admin) — mark COD balance collected
export const collectBalance = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) return res.status(404).json({ error: "Order not found." });
  // Advance-paid (half-COD) has a partial balance; pending (full COD) has the
  // whole amount due on delivery. Both are collectable here.
  if (order.paymentStatus !== "advance-paid" && order.paymentStatus !== "pending") {
    return res.status(400).json({ error: "This order has no pending balance." });
  }
  const by = req.admin?.name || req.admin?.email || "admin";
  order.advancePaid = Number(order.total) || order.advancePaid;
  order.pendingAmount = 0;
  order.paymentStatus = "paid";
  pushTimeline(order, "Balance collected on delivery", by);
  await order.save();
  res.json(order.toJSON());
});

// PUT /api/orders/:id/refund  { refundStatus }   (admin)
export const updateRefund = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) return res.status(404).json({ error: "Order not found." });

  const allowed = ["none", "pending", "refunded", "not-applicable"];
  const status = req.body?.refundStatus;
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid refund status." });
  }
  order.cancellation.refundStatus = status;
  const by = req.admin?.name || req.admin?.email || "admin";
  pushTimeline(order, `Refund marked ${status}`, by);
  await order.save();
  res.json(order.toJSON());
});
