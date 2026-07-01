import Coupon from "../models/Coupon.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { evaluateCoupon } from "../services/couponService.js";

// GET /api/coupons
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons.map((c) => c.toJSON()));
});

// POST /api/coupons
export const createCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();
  if (!code) return res.status(400).json({ error: "Code is required." });
  if (await Coupon.findOne({ code })) {
    return res.status(409).json({ error: "That code already exists." });
  }
  const coupon = await Coupon.create({
    code,
    type: ["flat", "percent", "bogo"].includes(req.body.type) ? req.body.type : "percent",
    value: Number(req.body.value) || 0,
    buyQty: Number(req.body.buyQty) || 1,
    freeQty: Number(req.body.freeQty) || 1,
    minOrder: Number(req.body.minOrder) || 0,
    active: req.body.active !== false,
    expiry: req.body.expiry || "",
  });
  res.status(201).json(coupon.toJSON());
});

// PUT /api/coupons/:code
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() });
  if (!coupon) return res.status(404).json({ error: "Coupon not found." });

  const { code, ...patch } = req.body; // code is immutable
  Object.assign(coupon, patch);
  await coupon.save();
  res.json(coupon.toJSON());
});

// DELETE /api/coupons/:code
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOneAndDelete({ code: req.params.code.toUpperCase() });
  if (!coupon) return res.status(404).json({ error: "Coupon not found." });
  res.json({ ok: true });
});

// POST /api/coupons/validate  { code, subtotal, items }
export const validateCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();
  if (!code) return res.json({ ok: false, error: "Enter a code." });

  const coupon = await Coupon.findOne({ code });
  const result = evaluateCoupon(coupon, Number(req.body.subtotal) || 0, req.body.items || []);
  if (!result.ok) return res.json({ ok: false, error: result.reason });
  res.json(result);
});
