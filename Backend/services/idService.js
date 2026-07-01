import Product from "../models/Product.js";
import Order from "../models/Order.js";

/**
 * Generate the next sequential product id ("p83", "p84"…) so ids stay
 * consistent with the original seeded catalog.
 */
export async function nextProductId() {
  const last = await Product.find({ id: /^p\d+$/ })
    .sort({ createdAt: -1 })
    .limit(200)
    .select("id")
    .lean();
  const max = last.reduce((m, p) => {
    const n = parseInt(String(p.id).slice(1), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `p${max + 1 || Date.now()}`;
}

/** Generate the next order id ("DIL-1043", "DIL-1044"…). */
export async function nextOrderId() {
  const count = await Order.countDocuments();
  return `DIL-${1043 + count}`;
}

/** Simple time-based unique id with a prefix (videos, reviews…). */
export const timeId = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
