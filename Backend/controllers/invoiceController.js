import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { getOrCreateInvoice, buildInvoicePdf, emailInvoice } from "../services/invoiceService.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/invoices?q=&payment=&from=&to=   (admin)
export const listInvoices = asyncHandler(async (req, res) => {
  const { q, payment, from, to } = req.query;
  const filter = {};
  if (payment) filter.payment = payment;
  if (from || to) {
    filter.issuedAt = {};
    if (from) filter.issuedAt.$gte = Number(from) || Date.parse(from) || 0;
    if (to) filter.issuedAt.$lte = Number(to) || Date.parse(to) || Date.now();
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    filter.$or = [{ id: rx }, { orderId: rx }, { "customer.name": rx }, { "customer.phone": rx }];
  }
  const invoices = await Invoice.find(filter).sort({ issuedAt: -1 }).limit(500);
  res.json(invoices.map((i) => i.toJSON()));
});

/** Resolve the invoice for an order, generating it on first request. */
async function resolveInvoice(orderId) {
  let invoice = await Invoice.findOne({ orderId });
  if (invoice) return invoice;
  const order = await Order.findOne({ id: orderId });
  if (!order) return null;
  return getOrCreateInvoice(order);
}

// GET /api/invoices/:orderId  (admin) — invoice record for an order (creates if missing)
export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await resolveInvoice(req.params.orderId);
  if (!invoice) return res.status(404).json({ error: "Order not found." });
  res.json(invoice.toJSON());
});

// GET /api/invoices/:orderId/pdf  (admin) — download the PDF
export const downloadInvoice = asyncHandler(async (req, res) => {
  const invoice = await resolveInvoice(req.params.orderId);
  if (!invoice) return res.status(404).json({ error: "Order not found." });

  const pdf = await buildInvoicePdf(invoice);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.id}.pdf"`);
  res.send(pdf);
});

// POST /api/invoices/:orderId/email  { email? }  (admin) — send / resend
export const sendInvoiceEmail = asyncHandler(async (req, res) => {
  const invoice = await resolveInvoice(req.params.orderId);
  if (!invoice) return res.status(404).json({ error: "Order not found." });

  const result = await emailInvoice(invoice, req.body?.email);
  if (result.skipped && result.reason === "no-email") {
    return res.status(400).json({ error: "No customer email on file — provide one to send." });
  }
  if (!result.ok) {
    return res.status(502).json({ error: result.error || "Email is not configured on the server." });
  }
  res.json({ ok: true, emailedTo: result.messageId ? (req.body?.email || invoice.customer?.email) : "" });
});
