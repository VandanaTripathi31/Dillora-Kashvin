import Review from "../models/Review.js";
import Order from "../models/Order.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { timeId } from "../services/idService.js";
import { uploadBuffer, isCloudinaryConfigured } from "../config/cloudinary.js";

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

// Only approved reviews are shown publicly. Missing `approved` (legacy rows)
// counts as approved so existing reviews stay visible.
const APPROVED_FILTER = { approved: { $ne: false } };

// GET /api/reviews/:productId  (public — approved only)
export const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId, ...APPROVED_FILTER }).sort({ createdAt: -1 });
  res.json(reviews.map((r) => r.toJSON()));
});

// GET /api/reviews/:productId/summary  -> { avg, count }  (approved only)
export const getRatingSummary = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId, ...APPROVED_FILTER });
  if (!reviews.length) return res.json({ avg: 0, count: 0 });
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  res.json({ avg: Math.round(avg * 10) / 10, count: reviews.length });
});

// GET /api/reviews/:productId/can?phone=...
export const canReview = asyncHandler(async (req, res) => {
  const result = await canReviewCheck(req.params.productId, req.query.phone || "");
  res.json(result);
});

// POST /api/reviews/:productId  { name, phone, email, title, rating, text, images[], video }
export const addReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { name, phone, email, title, rating, text, images, video } = req.body;

  const elig = await canReviewCheck(productId, phone);
  if (!elig.ok) return res.json({ ok: false, reason: elig.reason });

  const r = Math.max(1, Math.min(5, Number(rating) || 0));
  if (!r) return res.json({ ok: false, reason: "rating" });

  const cleanImages = Array.isArray(images)
    ? images.filter((u) => typeof u === "string" && u).slice(0, 5)
    : [];

  await Review.create({
    id: timeId("r"),
    productId,
    name: name || "Customer",
    phone,
    email: String(email || "").trim(),
    title: String(title || "").trim().slice(0, 120),
    rating: r,
    text: String(text || "").trim(),
    images: cleanImages,
    video: typeof video === "string" ? video : "",
    verified: true,
    approved: true,
    createdAt: Date.now(),
  });
  res.status(201).json({ ok: true });
});

// POST /api/reviews/:productId/upload  (multipart "file", body: phone, kind)
// Public but gated by the verified-buyer check so only real buyers can upload.
export const uploadReviewMedia = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({ error: "Media upload is not configured on the server." });
  }
  const { productId } = req.params;
  const phone = req.body?.phone || "";
  const elig = await canReviewCheck(productId, phone);
  // "already" is fine here — they can still attach media while editing before submit.
  if (!elig.ok && elig.reason !== "already") {
    return res.status(403).json({ error: "Only verified buyers can upload review media." });
  }
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const isVideo = req.body?.kind === "video" || (req.file.mimetype || "").startsWith("video");
  const result = await uploadBuffer(req.file.buffer, {
    folder: "dillora/reviews",
    resourceType: isVideo ? "video" : "image",
  });
  res.status(201).json({ url: result.url, publicId: result.publicId });
});

// ---- Admin moderation ----

// GET /api/reviews/admin/all  (admin) — every review, incl. hidden
export const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(1000);
  res.json(reviews.map((r) => r.toJSON()));
});

// PUT /api/reviews/admin/:id/approve  { approved }  (admin)
export const setReviewApproval = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ id: req.params.id });
  if (!review) return res.status(404).json({ error: "Review not found." });
  review.approved = !!req.body?.approved;
  await review.save();
  res.json(review.toJSON());
});

// PUT /api/reviews/admin/:id/reply  { text }  (admin)
export const replyReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ id: req.params.id });
  if (!review) return res.status(404).json({ error: "Review not found." });
  review.reply = { text: String(req.body?.text || "").trim(), at: Date.now() };
  await review.save();
  res.json(review.toJSON());
});

// DELETE /api/reviews/admin/:id  (admin)
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ id: req.params.id });
  if (!review) return res.status(404).json({ error: "Review not found." });
  res.json({ ok: true });
});
