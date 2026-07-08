import Coupon from "../models/Coupon.js";

/**
 * Coupon validation — ported verbatim from the storefront's original
 * localValidateCoupon so discounts behave identically online and offline.
 *
 * @returns {{ok:true, discount:number, coupon:object} | {ok:false, reason:string}}
 */
export function evaluateCoupon(coupon, subtotal, items = []) {
  if (!coupon) return { ok: false, reason: "Invalid code." };
  if (!coupon.active) return { ok: false, reason: "This code is no longer active." };
  if (coupon.expiry && new Date(coupon.expiry) < new Date(new Date().toDateString())) {
    return { ok: false, reason: "This code has expired." };
  }
  if (coupon.usageLimit > 0 && (coupon.usageCount || 0) >= coupon.usageLimit) {
    return { ok: false, reason: "This code has already been used." };
  }
  if (coupon.minOrder && subtotal < coupon.minOrder) {
    return {
      ok: false,
      reason: `Add ₹${(coupon.minOrder - subtotal).toLocaleString("en-IN")} more to use this code.`,
    };
  }

  let discount = 0;
  if (coupon.type === "bogo") {
    const buy = Math.max(1, Number(coupon.buyQty) || 1);
    const free = Math.max(1, Number(coupon.freeQty) || 1);
    const units = [];
    for (const it of items) for (let i = 0; i < it.qty; i++) units.push(it.price);
    units.sort((a, b) => a - b);
    const groupSize = buy + free;
    const fullGroups = Math.floor(units.length / groupSize);
    if (fullGroups === 0) {
      return {
        ok: false,
        reason: `Add ${groupSize - units.length} more item(s) to use this Buy ${buy} Get ${free} offer.`,
      };
    }
    for (let i = 0; i < free * fullGroups; i++) discount += units[i];
  } else if (coupon.type === "flat") {
    discount = Math.min(coupon.value, subtotal);
  } else {
    discount = Math.round((subtotal * coupon.value) / 100);
  }

  return {
    ok: true,
    discount,
    coupon: { code: coupon.code, type: coupon.type, value: coupon.value },
  };
}

// Unambiguous code alphabet (no 0/O/1/I) for readable, unique coupon codes.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(prefix, len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `${prefix}${s}`;
}

function isoDatePlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + (Number(days) || 0));
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Create a fresh, unique coupon (e.g. a review reward or welcome offer).
 * @returns the created Coupon document.
 */
export async function generateCoupon({
  prefix = "GIFT",
  type = "percent",
  value = 10,
  days = 30,
  source = "manual",
  description = "",
  usageLimit = 1,
  minOrder = 0,
} = {}) {
  let code;
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = randomCode(prefix);
    if (!(await Coupon.findOne({ code: candidate }))) { code = candidate; break; }
  }
  if (!code) code = randomCode(prefix, 8); // extremely unlikely fallback
  return Coupon.create({
    code,
    type,
    value,
    minOrder,
    active: true,
    expiry: days ? isoDatePlusDays(days) : "",
    description,
    source,
    usageLimit,
    usageCount: 0,
  });
}

/** Increment a coupon's redemption counter (best-effort, never throws). */
export async function recordCouponUsage(code) {
  const c = String(code || "").toUpperCase().trim();
  if (!c) return;
  try {
    await Coupon.updateOne({ code: c }, { $inc: { usageCount: 1 } });
  } catch {
    /* usage tracking is best-effort */
  }
}
