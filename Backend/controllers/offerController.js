import Offer from "../models/Offer.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { timeId } from "../services/idService.js";
import { evaluateOffers } from "../services/offerService.js";

const todayStr = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

// POST /api/offers/evaluate  { items }   (public) — auto-apply at cart/checkout
export const evaluate = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const result = await evaluateOffers(items);
  res.json(result);
});

// GET /api/offers/active   (public) — active, in-window offers for display
export const getActiveOffers = asyncHandler(async (req, res) => {
  const today = todayStr();
  const offers = await Offer.find({ active: true }).sort({ priority: -1, createdAt: 1 });
  const shown = offers
    .filter((o) => (!o.startDate || today >= o.startDate) && (!o.endDate || today <= o.endDate))
    .filter((o) => !(o.usageLimit > 0 && o.usageCount >= o.usageLimit))
    .map((o) => ({ id: o.id, name: o.name, description: o.description }));
  res.json(shown);
});

// GET /api/offers   (admin)
export const listOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find().sort({ priority: -1, createdAt: -1 });
  res.json(offers.map((o) => o.toJSON()));
});

function cleanBuy(b = {}) {
  return {
    scope: b.scope === "product" ? "product" : "category",
    ref: String(b.ref || "").trim(),
    qty: Math.max(1, Math.floor(Number(b.qty) || 1)),
  };
}
function cleanReward(r = {}) {
  const type = ["free", "percent", "flat"].includes(r.type) ? r.type : "free";
  return {
    type,
    scope: r.scope === "product" ? "product" : "category",
    ref: String(r.ref || "").trim(),
    qty: Math.max(1, Math.floor(Number(r.qty) || 1)),
    value: Math.max(0, Number(r.value) || 0),
  };
}

// POST /api/offers   (admin)
export const createOffer = asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (!String(b.name || "").trim()) return res.status(400).json({ error: "Offer name is required." });

  const offer = await Offer.create({
    id: timeId("of"),
    name: String(b.name).trim(),
    description: b.description || "",
    active: b.active !== undefined ? !!b.active : true,
    priority: Number(b.priority) || 0,
    startDate: b.startDate || "",
    endDate: b.endDate || "",
    buy: cleanBuy(b.buy),
    reward: cleanReward(b.reward),
    usageLimit: Math.max(0, Math.floor(Number(b.usageLimit) || 0)),
  });
  res.status(201).json(offer.toJSON());
});

// PUT /api/offers/:id   (admin)
export const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({ id: req.params.id });
  if (!offer) return res.status(404).json({ error: "Offer not found." });

  const b = req.body || {};
  if (b.name !== undefined) offer.name = String(b.name).trim();
  if (b.description !== undefined) offer.description = b.description;
  if (b.active !== undefined) offer.active = !!b.active;
  if (b.priority !== undefined) offer.priority = Number(b.priority) || 0;
  if (b.startDate !== undefined) offer.startDate = b.startDate || "";
  if (b.endDate !== undefined) offer.endDate = b.endDate || "";
  if (b.usageLimit !== undefined) offer.usageLimit = Math.max(0, Math.floor(Number(b.usageLimit) || 0));
  if (b.buy) offer.buy = cleanBuy(b.buy);
  if (b.reward) offer.reward = cleanReward(b.reward);

  await offer.save();
  res.json(offer.toJSON());
});

// DELETE /api/offers/:id   (admin)
export const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findOneAndDelete({ id: req.params.id });
  if (!offer) return res.status(404).json({ error: "Offer not found." });
  res.json({ ok: true });
});
