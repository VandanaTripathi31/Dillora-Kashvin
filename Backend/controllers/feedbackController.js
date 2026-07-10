import Feedback from "../models/Feedback.js";
import { asyncHandler, fail } from "../utils/responseHandler.js";
import { timeId } from "../services/idService.js";

// ---- Public / customer ----

// GET /api/feedback  -> approved feedback for the storefront testimonials
export const getApprovedFeedback = asyncHandler(async (req, res) => {
  const items = await Feedback.find({ approved: true }).sort({ createdAt: -1 }).limit(60);
  res.json(items.map((f) => f.toJSON()));
});

// GET /api/feedback/summary  -> { avg, count } over approved feedback
export const getFeedbackSummary = asyncHandler(async (req, res) => {
  const items = await Feedback.find({ approved: true });
  if (!items.length) return res.json({ avg: 0, count: 0 });
  const avg = items.reduce((s, f) => s + f.rating, 0) / items.length;
  res.json({ avg: Math.round(avg * 10) / 10, count: items.length });
});

// GET /api/feedback/can?phone=...  -> can this signed-in customer submit? plus any existing feedback (to pre-fill / show status)
export const canSubmitFeedback = asyncHandler(async (req, res) => {
  const phone = String(req.query.phone || "");
  if (!phone) return res.json({ ok: false, reason: "login" });
  const existing = await Feedback.findOne({ phone });
  res.json({ ok: true, existing: existing ? existing.toJSON() : null });
});

// POST /api/feedback  { name, phone, location, rating, text }  (signed-in customers only)
export const submitFeedback = asyncHandler(async (req, res) => {
  const { name, location, rating, text } = req.body || {};
  const phone = String(req.body?.phone || "").trim();
  if (!phone) return res.json({ ok: false, reason: "login" });

  const r = Math.max(1, Math.min(5, Number(rating) || 0));
  if (!r) return res.json({ ok: false, reason: "rating" });

  const clean = {
    name: (name || "Customer").trim(),
    location: String(location || "").trim(),
    rating: r,
    text: String(text || "").trim(),
    approved: false, // must be approved by an admin before it appears on the site
    createdAt: Date.now(),
  };

  // One piece of feedback per customer — updating re-submits it for approval.
  const existing = await Feedback.findOne({ phone });
  if (existing) {
    Object.assign(existing, clean);
    await existing.save();
  } else {
    await Feedback.create({ id: timeId("f"), phone, ...clean });
  }
  res.status(201).json({ ok: true });
});

// ---- Admin (protected) ----

// GET /api/feedback/all  -> everything, incl. pending, for moderation
export const getAllFeedback = asyncHandler(async (req, res) => {
  const items = await Feedback.find().sort({ createdAt: -1 });
  res.json(items.map((f) => f.toJSON()));
});

// PUT /api/feedback/:id/approve  { approved }
export const setApproved = asyncHandler(async (req, res) => {
  const item = await Feedback.findOne({ id: req.params.id });
  if (!item) return fail(res, "Feedback not found.", 404);
  item.approved = req.body?.approved !== false;
  await item.save();
  res.json(item.toJSON());
});

// DELETE /api/feedback/:id
export const deleteFeedback = asyncHandler(async (req, res) => {
  await Feedback.deleteOne({ id: req.params.id });
  res.json({ ok: true });
});
