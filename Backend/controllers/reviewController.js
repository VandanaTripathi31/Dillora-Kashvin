import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Setting from "../models/Setting.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { timeId } from "../services/idService.js";
import { uploadBuffer, isCloudinaryConfigured } from "../config/cloudinary.js";
import { generateCoupon } from "../services/couponService.js";

// Anyone may leave a review — we no longer gate on delivery. This only reports
// whether the reviewer is a *verified buyer* (phone linked to a delivered order
// for this product), which drives the "Verified buyer" badge but never blocks.
async function isVerifiedBuyer(productId, phone) {
  if (!phone) return false;
  const orders = await Order.find({
    $or: [{ "customer.phone": phone }, { userPhone: phone }],
    status: "Delivered",
  });
  return orders.some((o) => (o.items || []).some((it) => it.productId === productId));
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

// GET /api/reviews/summary?ids=p1,p2,...  -> { p1:{avg,count}, p2:{...}, ... }
// Batched rating summaries (approved only) so a product grid fetches every
// card's rating in ONE request instead of one call per card. Ids not found are
// returned as { avg:0, count:0 } so the frontend always gets an entry per id.
export const getRatingSummaries = asyncHandler(async (req, res) => {
  const ids = [
    ...new Set(
      String(req.query.ids || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ].slice(0, 200); // cap to keep the query bounded

  const out = {};
  for (const id of ids) out[id] = { avg: 0, count: 0 };

  if (ids.length) {
    const rows = await Review.aggregate([
      { $match: { productId: { $in: ids }, approved: { $ne: false } } },
      { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    for (const r of rows) {
      out[r._id] = { avg: Math.round(r.avg * 10) / 10, count: r.count };
    }
  }

  res.json(out);
});

// GET /api/reviews/:productId/can?phone=...  — anyone may review; this only
// reports whether they're a verified buyer (for the badge). Always ok:true.
export const canReview = asyncHandler(async (req, res) => {
  const verified = await isVerifiedBuyer(req.params.productId, req.query.phone || "");
  res.json({ ok: true, verified });
});

// POST /api/reviews/:productId  { name, phone, email, title, rating, text, images[], video }
export const addReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { name, phone, email, title, rating, text, images, video } = req.body;

  const r = Math.max(1, Math.min(5, Number(rating) || 0));
  if (!r) return res.json({ ok: false, reason: "rating" });

  const cleanImages = Array.isArray(images)
    ? images.filter((u) => typeof u === "string" && u).slice(0, 5)
    : [];

  // Non-blocking: anyone can post. The verified badge is granted only when the
  // phone links to a delivered order for this product.
  const verified = await isVerifiedBuyer(productId, phone);

  await Review.create({
    id: timeId("r"),
    productId,
    name: (name && String(name).trim()) || "Customer",
    phone: String(phone || "").trim(),
    email: String(email || "").trim(),
    title: String(title || "").trim().slice(0, 120),
    rating: r,
    text: String(text || "").trim(),
    images: cleanImages,
    video: typeof video === "string" ? video : "",
    verified,
    approved: true,
    createdAt: Date.now(),
  });

  // Auto-reward a single-use coupon when the admin has enabled it (best-effort).
  let reward = null;
  try {
    const setting = await Setting.findOne({ key: "site" });
    const rr = setting?.reviewReward;
    if (rr?.enabled) {
      const percent = Math.max(1, Math.min(90, Number(rr.percent) || 10));
      const days = Math.max(1, Number(rr.days) || 30);
      const coupon = await generateCoupon({
        prefix: "REVIEW",
        type: "percent",
        value: percent,
        days,
        source: "review",
        description: `Thanks for your review — ${percent}% off`,
        usageLimit: 1,
      });
      reward = { code: coupon.code, percent, days };
    }
  } catch {
    /* rewarding is best-effort — never block the review */
  }

  res.status(201).json({ ok: true, verified, reward });
});

// POST /api/reviews/:productId/upload  (multipart "file", body: phone, kind)
// Public — any reviewer can attach a photo/video with their review.
export const uploadReviewMedia = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({ error: "Media upload is not configured on the server." });
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
