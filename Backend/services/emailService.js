import {
  getTransport,
  isMailConfigured,
  mailFrom,
  supportEmail,
  adminAlertEmail,
} from "../config/mailer.js";

const BRAND = "Dillora by Kashvin";
const ACCENT = "#a64fd6";

/**
 * Wrap body HTML in a lightweight, email-client-safe branded layout.
 * Inline styles only — email clients strip <style>/external CSS.
 * @param {string} title  - heading shown at the top of the card.
 * @param {string} bodyHtml - inner HTML (already escaped where needed).
 */
export function emailLayout(title, bodyHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4ecf6;font-family:Arial,Helvetica,sans-serif;color:#2c2336;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(122,79,240,.12);">
      <tr>
        <td style="background:linear-gradient(135deg,#a64fd6 0%,#8b63ef 55%,#7a4ff0 100%);padding:20px 28px;">
          <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:.3px;">${BRAND}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#2c2336;">${title}</h1>
          <div style="font-size:14px;line-height:1.6;color:#4a4356;">${bodyHtml}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px;background:#faf5fe;border-top:1px solid #f0e6f8;font-size:12px;color:#8b7fa0;">
          This is an automated message from ${BRAND}.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Escape a value for safe interpolation into email HTML. */
export const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Send an email. Never throws — email is best-effort plumbing, so a failure
 * here must not break the order/stock operation that triggered it. Returns a
 * small status object callers can log or ignore.
 *
 * @param {object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} [opts.html]
 * @param {string} [opts.text]
 * @param {Array}  [opts.attachments] - nodemailer attachment objects.
 * @returns {Promise<{ok:boolean, skipped?:boolean, error?:string, messageId?:string}>}
 */
export async function sendMail({ to, subject, html, text, attachments }) {
  const recipients = (Array.isArray(to) ? to : [to])
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  if (!isMailConfigured()) {
    console.warn(`[email] SMTP not configured — skipped "${subject}".`);
    return { ok: false, skipped: true };
  }
  if (!recipients.length) {
    console.warn(`[email] No recipients — skipped "${subject}".`);
    return { ok: false, skipped: true };
  }

  try {
    const info = await getTransport().sendMail({
      from: mailFrom(),
      to: recipients.join(", "),
      subject,
      text,
      html,
      attachments,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[email] Failed to send "${subject}":`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Internal ops alert — sent to the support + admin inboxes (de-duplicated).
 * Used by stock-change, cancellation and similar back-office notifications.
 * @param {object} opts
 * @param {string} opts.subject
 * @param {string} opts.title - layout heading.
 * @param {string} opts.bodyHtml - inner HTML for the branded layout.
 */
export async function notifyOps({ subject, title, bodyHtml }) {
  const to = [...new Set([supportEmail(), adminAlertEmail()].filter(Boolean))];
  return sendMail({ to, subject, html: emailLayout(title, bodyHtml) });
}

/**
 * Alert the shop owner that a new order was placed. Best-effort (never throws) —
 * a failed email must not break order placement. So the owner knows immediately
 * a sale came in without watching the dashboard.
 */
export async function notifyNewOrder(order) {
  const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const payLabel =
    order.payment === "cod" ? "Cash on Delivery" :
    order.payment === "half-cod" ? "Half online + COD" : "Paid online";
  const itemsHtml = (order.items || [])
    .map((it) => `<tr>
      <td style="padding:4px 8px;border-top:1px solid #eee;">${esc(it.name)}${it.options && it.options !== "—" ? ` <span style="color:#8b7fa0;">(${esc(it.options)})</span>` : ""}</td>
      <td style="padding:4px 8px;border-top:1px solid #eee;text-align:center;">×${Number(it.qty) || 1}</td>
      <td style="padding:4px 8px;border-top:1px solid #eee;text-align:right;">${rupees(it.price * (Number(it.qty) || 1))}</td>
    </tr>`).join("");

  const bodyHtml = `
    <p>A new order just came in 🎉</p>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;">
      <tr><td style="color:#8b7fa0;">Order</td><td><b>${esc(order.id)}</b></td></tr>
      <tr><td style="color:#8b7fa0;">Customer</td><td>${esc(order.customer?.name || "")} · ${esc(order.customer?.phone || "")}</td></tr>
      <tr><td style="color:#8b7fa0;">Address</td><td>${esc(order.customer?.address || "—")}</td></tr>
      <tr><td style="color:#8b7fa0;">Payment</td><td>${payLabel}${order.paymentStatus ? ` · ${esc(order.paymentStatus)}` : ""}</td></tr>
      <tr><td style="color:#8b7fa0;">Total</td><td><b>${rupees(order.total)}</b>${order.pendingAmount ? ` · ${rupees(order.pendingAmount)} due on delivery` : ""}</td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:12px;">${itemsHtml}</table>
    <p style="margin-top:14px;">Open the dashboard to process it.</p>`;

  return notifyOps({
    subject: `🎉 New order ${order.id} · ${rupees(order.total)}`,
    title: "New order received",
    bodyHtml,
  });
}
