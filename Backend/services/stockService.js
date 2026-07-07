import Product from "../models/Product.js";
import StockLog from "../models/StockLog.js";
import { timeId } from "./idService.js";
import { notifyOps, esc } from "./emailService.js";

/**
 * Central stock service — the single choke point for stock changes so that
 * every mutation is audited (StockLog) and the ops team is notified. Admin
 * product edits call `logStockChange` (they already hold the doc); automated
 * flows like cancellation-restore call `adjustStock` for an atomic delta.
 */

function fmtTime(ms) {
  // Human-readable IST timestamp for the notification email.
  return new Date(ms).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

/**
 * Send the "stock changed" ops email (best-effort; never throws).
 * Satisfies the Stock Notification requirement: product, old/new, who, when.
 */
async function notifyStockChange(log) {
  const bodyHtml = `
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
      <tr><td style="color:#8b7fa0;">Product</td><td><b>${esc(log.productName)}</b> <span style="color:#8b7fa0;">(${esc(log.productId)})</span></td></tr>
      <tr><td style="color:#8b7fa0;">Old stock</td><td>${log.oldStock}</td></tr>
      <tr><td style="color:#8b7fa0;">New stock</td><td><b>${log.newStock}</b> (${log.delta >= 0 ? "+" : ""}${log.delta})</td></tr>
      <tr><td style="color:#8b7fa0;">Updated by</td><td>${esc(log.actor)}</td></tr>
      <tr><td style="color:#8b7fa0;">Reason</td><td>${esc(log.reason)}</td></tr>
      <tr><td style="color:#8b7fa0;">Time</td><td>${esc(fmtTime(log.createdAt))}</td></tr>
    </table>`;
  return notifyOps({
    subject: `Stock updated: ${log.productName} (${log.oldStock} → ${log.newStock})`,
    title: "Stock change",
    bodyHtml,
  });
}

/**
 * Record a stock change that has already been applied to a product document.
 * Writes an audit log and fires the ops notification. No-ops when the value
 * didn't actually change. Never throws — auditing must not break the edit.
 *
 * @param {object} p
 * @param {string} p.productId
 * @param {string} p.productName
 * @param {number} p.oldStock
 * @param {number} p.newStock
 * @param {string} [p.reason]
 * @param {string} [p.actor]
 * @param {boolean} [p.notify=true]
 * @returns {Promise<object|null>} the created log (or null if unchanged/failed).
 */
export async function logStockChange({
  productId,
  productName,
  oldStock,
  newStock,
  reason = "manual",
  actor = "system",
  notify = true,
}) {
  const from = Number(oldStock) || 0;
  const to = Number(newStock) || 0;
  if (from === to) return null;

  try {
    const log = await StockLog.create({
      id: timeId("sl"),
      productId,
      productName,
      oldStock: from,
      newStock: to,
      delta: to - from,
      reason,
      actor,
    });
    if (notify) notifyStockChange(log).catch(() => {});
    return log.toJSON();
  } catch (err) {
    console.error("[stock] Failed to write audit log:", err.message);
    return null;
  }
}

/**
 * Atomically adjust a product's stock by a signed delta and record it.
 * Used by automated flows (e.g. cancellation restore = +qty). Uses `$inc`
 * so it is safe under concurrency.
 *
 * @param {object} p
 * @param {string} p.productId
 * @param {number} p.delta - signed change (e.g. +2 to restore, -1 to reserve).
 * @param {string} [p.reason]
 * @param {string} [p.actor]
 * @returns {Promise<object|null>} { product, log } or null if product missing.
 */
export async function adjustStock({ productId, delta, reason = "manual", actor = "system" }) {
  const change = Number(delta) || 0;
  if (!change) return null;

  const before = await Product.findOne({ id: productId }).select("id name stock").lean();
  if (!before) {
    console.warn(`[stock] adjustStock: product ${productId} not found.`);
    return null;
  }

  const product = await Product.findOneAndUpdate(
    { id: productId },
    { $inc: { stock: change } },
    { returnDocument: "after" }
  );

  const log = await logStockChange({
    productId,
    productName: before.name,
    oldStock: before.stock,
    newStock: product.stock,
    reason,
    actor,
  });

  return { product, log };
}
