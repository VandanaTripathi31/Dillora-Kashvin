import nodemailer from "nodemailer";

/**
 * Email is optional plumbing shared by several features (stock alerts, invoice
 * delivery, cancellation notices). We build a generic SMTP transport so any
 * provider works — Gmail app-passwords, Zoho, Resend, SendGrid, Mailgun, Brevo,
 * etc. all expose SMTP. When SMTP isn't configured, the service degrades to a
 * no-op (see services/emailService.js) so orders and stock changes never break.
 *
 * IMPORTANT: env vars are read lazily (inside helpers), NOT captured at module
 * load. In ESM, imports run before server.js calls dotenv.config(), so reading
 * process.env at the top level would see undefined values.
 */
export const isMailConfigured = () =>
  Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );

/** The "From" address for outgoing mail (falls back to the SMTP user). */
export const mailFrom = () =>
  process.env.MAIL_FROM ||
  process.env.SMTP_USER ||
  "Dillora <no-reply@dillora.com>";

/** Support inbox — customer-facing notifications (order/stock ops). */
export const supportEmail = () =>
  process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || "";

/** Admin/ops inbox — internal alerts (stock changes, cancellations). */
export const adminAlertEmail = () =>
  process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || "";

let instance = null;
export const getTransport = () => {
  if (!isMailConfigured()) return null;
  if (!instance) {
    const port = Number(process.env.SMTP_PORT) || 587;
    instance = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 = implicit TLS; 587/25 = STARTTLS.
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return instance;
};
