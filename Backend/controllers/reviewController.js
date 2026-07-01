import Review from "../models/Review.js";
import Order from "../models/Order.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { timeId } from "../services/idService.js";

// Shared eligibility check — ported from the storefront's localCanReview.
async function canReviewCheck(productId, phone) {
  if (!phone) return { ok: false, reason: "login" };
  const already = await Review.findOne({ productId, phone });
  if (already) return { ok: false, reason: "already" };

  const orders = await Order.find({
    $or: [{ "customer.phone": phone }, { userPhone: phone }],
    status: "Delivered",
  });
  const delivered = orders.some((o) => (o.items || []).some((it) => it.productId === productId));
  return delivered ? { ok: true } : { ok: false, reason: "not-delivered" };
}

// GET /api/reviews/:productId
export const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
  res.json(reviews.map((r) => r.toJSON()));
});

// GET /api/reviews/:productId/summary  -> { avg, count }
export const getRatingSummary = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId });
  if (!reviews.length) return res.json({ avg: 0, count: 0 });
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  res.json({ avg: Math.round(avg * 10) / 10, count: reviews.length });
});

// GET /api/reviews/:productId/can?phone=...
export const canReview = asyncHandler(async (req, res) => {
  const result = await canReviewCheck(req.params.productId, req.query.phone || "");
  res.json(result);
});

// POST /api/reviews/:productId  { name, phone, rating, text }
export const addReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { name, phone, rating, text } = req.body;

  const elig = await canReviewCheck(productId, phone);
  if (!elig.ok) return res.json({ ok: false, reason: elig.reason });

  const r = Math.max(1, Math.min(5, Number(rating) || 0));
  if (!r) return res.json({ ok: false, reason: "rating" });

  await Review.create({
    id: timeId("r"),
    productId,
    name: name || "Customer",
    phone,
    rating: r,
    text: String(text || "").trim(),
    createdAt: Date.now(),
  });
  res.status(201).json({ ok: true });
});
