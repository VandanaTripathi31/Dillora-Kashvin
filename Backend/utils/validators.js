/**
 * Lightweight validation/normalisation helpers. Kept dependency-free.
 */

export const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

export const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const isEmail = (v) =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Turn a name into a url-safe slug id, e.g. "Coin Pouch" -> "coin-pouch". */
export const slugify = (str) =>
  String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Require the given fields to be present & non-empty on an object. */
export const requireFields = (obj, fields) => {
  const missing = fields.filter((f) => !isNonEmptyString(String(obj?.[f] ?? "")));
  return missing.length ? `Missing required field(s): ${missing.join(", ")}` : null;
};
