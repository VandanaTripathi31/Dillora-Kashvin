import Product from "../models/Product.js";
import { nextSeq } from "../models/Counter.js";

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

/**
 * Current date in IST (Asia/Kolkata, UTC+5:30) as a "YYYYMMDD" string.
 * Order ids are day-scoped, and the store operates in India, so the daily
 * bucket is computed in IST regardless of server timezone.
 */
function istDateStamp() {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  const d = new Date(istMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/**
 * Generate the next order id, e.g. "DK202607060001".
 * Format: "DK" + YYYYMMDD (IST) + a 4-digit sequence that resets each day.
 * The sequence is drawn from an atomic counter, so ids are guaranteed unique
 * and never reused — even under concurrency or after orders are deleted.
 * (Legacy "DIL-xxxx" ids remain valid; only newly created orders use this.)
 */
export async function nextOrderId() {
  const stamp = istDateStamp();
  const seq = await nextSeq(`order-${stamp}`);
  return `DK${stamp}${String(seq).padStart(4, "0")}`;
}

/**
 * Generate the next invoice number, e.g. "INV-00001". Uses a single global
 * atomic counter so numbers are strictly sequential and never duplicated.
 */
export async function nextInvoiceNo() {
  const seq = await nextSeq("invoice");
  return `INV-${String(seq).padStart(5, "0")}`;
}

/** Simple time-based unique id with a prefix (videos, reviews…). */
export const timeId = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
