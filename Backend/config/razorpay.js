import Razorpay from "razorpay";

/**
 * Razorpay is optional: the storefront still works with Cash-on-Delivery /
 * demo flows if keys are absent. We only construct the client when both the
 * key id and secret are present, and expose a guard so controllers can return
 * a clean 503 instead of crashing when payments aren't configured.
 *
 * IMPORTANT: env vars are read lazily (inside these helpers), NOT captured at
 * module load. In ESM, imports run before server.js calls dotenv.config(), so
 * reading process.env at the top level would see undefined values.
 */
export const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET);

export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID || "";

export const razorpayKeySecret = () => process.env.RAZORPAY_SECRET || "";

let instance = null;
export const getRazorpay = () => {
  if (!isRazorpayConfigured()) return null;
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
  }
  return instance;
};
