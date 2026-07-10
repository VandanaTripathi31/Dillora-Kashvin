import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { evaluateCoupon } from "./couponService.js";
import { evaluateOffers } from "./offerService.js";

// Storefront pricing rules — MUST match Frontend/app/(storefront)/checkout/page.jsx.
const FREE_SHIP_THRESHOLD = 299;
const SHIP_FEE = 49;

// Thrown when an order can't be priced/validated (empty cart, unknown product,
// out of stock). Carries an HTTP status so controllers can respond cleanly.
export class PricingError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Recompute the authoritative figures for an order from TRUSTED database prices.
 * The client never dictates prices or totals — every unit price is validated
 * against the real product (base price or a listed material price), and the
 * subtotal / shipping / coupon / offer / total / payNow are all rebuilt here
 * exactly the way the storefront does. This is the single source of truth used
 * by both the online-payment path and the COD path so neither can be tampered.
 *
 * @returns {Promise<{items, subtotal, shipping, discount, coupon, offers, offerDiscount, total, payment, payNow}>}
 */
export async function computeOrderPricing({ items, payment, coupon } = {}) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) throw new PricingError("Your cart is empty.");

  const ids = [...new Set(list.map((i) => i?.productId).filter(Boolean))];
  const docs = await Product.find({ id: { $in: ids } });
  const byId = new Map(docs.map((d) => [d.id, d]));

  const validatedItems = [];
  let subtotal = 0;

  for (const it of list) {
    const p = byId.get(it?.productId);
    if (!p) throw new PricingError("A product in your cart is no longer available. Please refresh your cart.");

    const qty = Math.max(1, Math.floor(Number(it?.qty) || 0));

    // Stock guard (skip products that don't track stock, i.e. stock <= 0 meaning
    // made-to-order is represented as a positive number; here we only block when
    // a positive stock exists and is exceeded).
    if (Number.isFinite(p.stock) && p.stock > 0 && qty > p.stock) {
      throw new PricingError(`Only ${p.stock} left of "${p.name}". Please lower the quantity.`);
    }

    // Valid unit prices = base price + any listed material add-on prices. A price
    // the client sends that isn't one of these is rejected in favour of the base
    // price — this is what blocks "pay ₹1 for a ₹1000 item".
    const valid = new Set([Number(p.price)]);
    (p.materials || []).forEach((m) => valid.add(Number(m.price)));
    const clientPrice = Number(it?.price);
    const unit = valid.has(clientPrice) ? clientPrice : Number(p.price);

    subtotal += unit * qty;
    validatedItems.push({
      productId: p.id,
      name: p.name,
      category: p.category,
      options: String(it?.options || "—").slice(0, 300),
      qty,
      price: unit,
      image: p.image,
    });
  }

  const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIP_FEE;

  // Coupon — re-validated against the DB; silently ignored if invalid/expired.
  let discount = 0;
  let couponOut;
  const code = String(coupon?.code || coupon || "").trim().toUpperCase();
  if (code) {
    const c = await Coupon.findOne({ code });
    const r = evaluateCoupon(c, subtotal, validatedItems);
    if (r.ok) {
      discount = Number(r.discount) || 0;
      couponOut = { code, discount };
    }
  }

  // Auto-applied promotional offers — re-evaluated server-side.
  const offerRes = await evaluateOffers(validatedItems);
  const offerDiscount = Number(offerRes?.discount) || 0;
  const offers = (offerRes?.offers || []).map((o) => ({ id: o.id, name: o.name, discount: o.discount }));

  const total = Math.max(0, subtotal - discount - offerDiscount) + shipping;
  const pay = payment === "half-cod" ? "half-cod" : payment === "cod" ? "cod" : "online";
  const payNow = pay === "half-cod" ? Math.round(total / 2) : pay === "cod" ? 0 : total;

  return { items: validatedItems, subtotal, shipping, discount, coupon: couponOut, offers, offerDiscount, total, payment: pay, payNow };
}

// Whitelist the customer fields we accept from the client (never trust extra keys).
export function sanitizeCustomer(c = {}) {
  return {
    name: String(c?.name || "").slice(0, 120),
    phone: String(c?.phone || "").slice(0, 20),
    email: String(c?.email || "").slice(0, 160),
    address: String(c?.address || "").slice(0, 600),
  };
}
