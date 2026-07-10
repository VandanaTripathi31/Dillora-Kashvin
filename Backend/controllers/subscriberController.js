import Subscriber from "../models/Subscriber.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { isEmail } from "../utils/validators.js";

// POST /api/newsletter  { email, source? }  (public)
// Idempotent — subscribing an already-subscribed email is a no-op success.
export const subscribe = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!isEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  const source = String(req.body?.source || "footer").slice(0, 40);
  try {
    await Subscriber.updateOne(
      { email },
      { $setOnInsert: { email, source, createdAt: Date.now() } },
      { upsert: true }
    );
  } catch (err) {
    if (err?.code !== 11000) throw err; // duplicate = already subscribed → ignore
  }
  res.json({ ok: true });
});

// GET /api/newsletter  (admin) — list subscribers
export const listSubscribers = asyncHandler(async (req, res) => {
  const subs = await Subscriber.find().sort({ createdAt: -1 }).limit(5000);
  res.json(subs.map((s) => s.toJSON()));
});
