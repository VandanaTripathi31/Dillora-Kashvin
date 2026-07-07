import PDFDocument from "pdfkit";
import QRCode from "qrcode";

import Invoice from "../models/Invoice.js";
import Setting from "../models/Setting.js";
import { nextInvoiceNo } from "./idService.js";
import { sendMail, emailLayout, esc } from "./emailService.js";

const BRAND = "#a64fd6";
const INK = "#2c2336";
const MUTED = "#6b5f78";

// pdfkit's built-in Helvetica has no ₹ glyph, so use "Rs." for reliability.
const rupee = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (ms) =>
  new Date(ms).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

async function sellerConfig() {
  const s = await Setting.findOne({ key: "site" });
  const inv = s?.invoice?.toObject?.() || s?.invoice || {};
  return {
    sellerName: inv.sellerName || "Dillora by Kashvin",
    sellerAddress: inv.sellerAddress || "",
    sellerPhone: inv.sellerPhone || "",
    sellerEmail: inv.sellerEmail || "",
    gstNumber: inv.gstNumber || "",
    gstPercent: Number(inv.gstPercent) || 0,
    logoUrl: inv.logoUrl || "",
  };
}

/**
 * Get the invoice for an order, creating it (with a fresh number + snapshot)
 * if one doesn't exist yet. Idempotent — one invoice per order.
 * @param {object} order - a Mongoose Order doc or plain order object.
 */
export async function getOrCreateInvoice(order) {
  const orderId = order.id;
  const existing = await Invoice.findOne({ orderId });
  if (existing) return existing;

  const cfg = await sellerConfig();
  const total = Number(order.total) || 0;

  // GST is inclusive: back-calculate the tax already contained in the total.
  let gstAmount = 0;
  if (cfg.gstPercent > 0 && cfg.gstNumber) {
    const taxable = total / (1 + cfg.gstPercent / 100);
    gstAmount = Math.round((total - taxable) * 100) / 100;
  }

  const id = await nextInvoiceNo();
  return Invoice.create({
    id,
    orderId,
    issuedAt: Date.now(),
    customer: {
      name: order.customer?.name || "",
      phone: order.customer?.phone || order.userPhone || "",
      email: order.customer?.email || "",
      address: order.customer?.address || "",
    },
    items: (order.items || []).map((i) => ({
      name: i.name,
      category: i.category,
      options: i.options,
      qty: i.qty,
      price: i.price,
    })),
    subtotal: Number(order.subtotal) || 0,
    // Invoice discount reflects total savings: coupon + auto-applied offers.
    discount: (Number(order.discount) || 0) + (Number(order.offerDiscount) || 0),
    gst: { number: cfg.gstNumber, percent: cfg.gstPercent, amount: gstAmount },
    total,
    payment: order.payment || "online",
    seller: {
      name: cfg.sellerName,
      address: cfg.sellerAddress,
      phone: cfg.sellerPhone,
      email: cfg.sellerEmail,
      gstNumber: cfg.gstNumber,
      logoUrl: cfg.logoUrl,
    },
  });
}

/**
 * Render a professional A4 PDF for an invoice and resolve to a Buffer.
 * Uses built-in fonts + embedded QR (and logo image if configured), so it runs
 * anywhere Node runs — no headless browser (Vercel/serverless-safe).
 */
export async function buildInvoicePdf(invoice) {
  const inv = invoice.toObject ? invoice.toObject() : invoice;

  // QR encodes the order id for quick back-office lookup.
  let qrBuf = null;
  try {
    qrBuf = await QRCode.toBuffer(`Dillora Order ${inv.orderId}`, { margin: 1, width: 130 });
  } catch { /* QR is optional */ }

  // Optional seller logo.
  let logoBuf = null;
  if (inv.seller?.logoUrl) {
    try {
      const r = await fetch(inv.seller.logoUrl);
      if (r.ok) logoBuf = Buffer.from(await r.arrayBuffer());
    } catch { /* logo is optional */ }
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    // ---------- Header ----------
    let y = 50;
    if (logoBuf) {
      try { doc.image(logoBuf, left, y, { fit: [130, 46] }); } catch { /* ignore */ }
    } else {
      doc.font("Helvetica-Bold").fontSize(20).fillColor(BRAND).text(inv.seller?.name || "Dillora by Kashvin", left, y);
    }

    // Right-side title block
    doc.font("Helvetica-Bold").fontSize(22).fillColor(INK).text("TAX INVOICE", left, y, { width, align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor(MUTED)
      .text(`Invoice No: ${inv.id}`, left, y + 28, { width, align: "right" })
      .text(`Order ID: ${inv.orderId}`, { width, align: "right" })
      .text(`Date: ${fmtDate(inv.issuedAt)}`, { width, align: "right" });

    // Seller details (left)
    let sy = logoBuf ? y + 54 : y + 28;
    doc.font("Helvetica").fontSize(9.5).fillColor(MUTED);
    const sellerLines = [
      inv.seller?.address,
      inv.seller?.phone ? `Phone: ${inv.seller.phone}` : "",
      inv.seller?.email || "",
      inv.seller?.gstNumber ? `GSTIN: ${inv.seller.gstNumber}` : "",
    ].filter(Boolean);
    sellerLines.forEach((line) => { doc.text(line, left, sy, { width: width / 2 }); sy += 13; });

    y = Math.max(sy, y + 84) + 6;
    doc.moveTo(left, y).lineTo(right, y).strokeColor("#eadff5").lineWidth(1).stroke();
    y += 16;

    // ---------- Bill To ----------
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text("Bill To", left, y);
    y += 16;
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(inv.customer?.name || "Customer", left, y);
    y += 15;
    doc.font("Helvetica").fontSize(9.5).fillColor(MUTED);
    [
      inv.customer?.phone ? `Phone: ${inv.customer.phone}` : "",
      inv.customer?.email || "",
      inv.customer?.address || "",
    ].filter(Boolean).forEach((line) => { doc.text(line, left, y, { width: width * 0.7 }); y += 13; });

    y += 12;

    // ---------- Items table ----------
    const cols = {
      idx: left,
      item: left + 26,
      qty: left + width - 170,
      unit: left + width - 120,
      amount: left + width - 70,
    };
    // header row
    doc.rect(left, y, width, 22).fill("#f6eefc");
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.5);
    doc.text("#", cols.idx + 4, y + 6);
    doc.text("Item", cols.item, y + 6);
    doc.text("Qty", cols.qty, y + 6, { width: 40, align: "right" });
    doc.text("Unit", cols.unit, y + 6, { width: 46, align: "right" });
    doc.text("Amount", cols.amount, y + 6, { width: 66, align: "right" });
    y += 22;

    doc.font("Helvetica").fontSize(9.5).fillColor(INK);
    (inv.items || []).forEach((it, i) => {
      const nameH = doc.heightOfString(it.name || "Item", { width: cols.qty - cols.item - 10 });
      const optH = it.options ? doc.heightOfString(it.options, { width: cols.qty - cols.item - 10 }) : 0;
      const rowH = Math.max(24, nameH + optH + 12);

      // page-break guard
      if (y + rowH > doc.page.height - 120) { doc.addPage(); y = 50; }

      doc.fillColor(INK).font("Helvetica").text(String(i + 1), cols.idx + 4, y + 4);
      doc.font("Helvetica-Bold").text(it.name || "Item", cols.item, y + 4, { width: cols.qty - cols.item - 10 });
      if (it.options) {
        doc.font("Helvetica").fontSize(8.5).fillColor(MUTED)
          .text(it.options, cols.item, y + 4 + nameH + 1, { width: cols.qty - cols.item - 10 });
        doc.fontSize(9.5).fillColor(INK);
      }
      doc.font("Helvetica").text(String(it.qty || 1), cols.qty, y + 4, { width: 40, align: "right" });
      doc.text(rupee(it.price), cols.unit, y + 4, { width: 46, align: "right" });
      doc.text(rupee((Number(it.price) || 0) * (Number(it.qty) || 1)), cols.amount, y + 4, { width: 66, align: "right" });

      y += rowH;
      doc.moveTo(left, y).lineTo(right, y).strokeColor("#f0e7f8").lineWidth(0.5).stroke();
    });

    // ---------- Totals ----------
    y += 12;
    const labelX = left + width - 220;
    const valX = left + width - 100;
    const totalRow = (label, val, bold = false, color = INK) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 10).fillColor(color);
      doc.text(label, labelX, y, { width: 110, align: "right" });
      doc.text(val, valX, y, { width: 100, align: "right" });
      y += bold ? 20 : 16;
    };
    totalRow("Subtotal", rupee(inv.subtotal));
    if (inv.discount > 0) totalRow("Discount", `- ${rupee(inv.discount)}`, false, "#2e9e6b");
    if (inv.gst?.percent > 0 && inv.gst?.amount > 0) {
      totalRow(`GST @ ${inv.gst.percent}% (incl.)`, rupee(inv.gst.amount), false, MUTED);
    }
    doc.moveTo(labelX, y).lineTo(valX + 100, y).strokeColor("#eadff5").lineWidth(1).stroke();
    y += 8;
    totalRow("Total", rupee(inv.total), true, BRAND);

    // ---------- Payment + QR ----------
    y += 10;
    const payLabel = inv.payment === "half-cod" ? "50% Advance + COD" : inv.payment === "online" ? "Online (Prepaid)" : inv.payment;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text("Payment Mode: ", left, y, { continued: true })
      .font("Helvetica").fillColor(MUTED).text(payLabel);

    if (qrBuf) {
      try { doc.image(qrBuf, right - 80, y - 6, { fit: [80, 80] }); } catch { /* ignore */ }
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text("Scan to reference order", right - 90, y + 76, { width: 100, align: "center" });
    }

    // ---------- Footer ----------
    const fy = doc.page.height - 70;
    doc.moveTo(left, fy).lineTo(right, fy).strokeColor("#eadff5").lineWidth(1).stroke();
    doc.font("Helvetica").fontSize(9).fillColor(MUTED)
      .text("Thank you for shopping with Dillora by Kashvin — handmade with love.", left, fy + 10, { width, align: "center" });
    doc.fontSize(8).fillColor("#a99cb8")
      .text("This is a computer-generated invoice.", left, fy + 24, { width, align: "center" });

    doc.end();
  });
}

/**
 * Issue an invoice for a freshly-placed order: create/store the record, then
 * email it to the customer in the background. Never throws — invoicing must not
 * break order placement. Returns the invoice (or null on failure).
 */
export async function issueInvoice(order) {
  try {
    const invoice = await getOrCreateInvoice(order);
    emailInvoice(invoice).catch(() => {}); // background, best-effort
    return invoice;
  } catch (err) {
    console.error("[invoice] issue failed:", err.message);
    return null;
  }
}

/**
 * Email the invoice PDF to the customer (or an override address). Best-effort:
 * returns a status object and never throws. Records emailedAt/emailedTo on success.
 */
export async function emailInvoice(invoice, toOverride) {
  const inv = invoice.toObject ? invoice.toObject() : invoice;
  const to = String(toOverride || inv.customer?.email || "").trim();
  if (!to) return { ok: false, skipped: true, reason: "no-email" };

  let pdf;
  try {
    pdf = await buildInvoicePdf(invoice);
  } catch (err) {
    console.error("[invoice] PDF build failed:", err.message);
    return { ok: false, error: err.message };
  }

  const bodyHtml = `
    <p>Hi ${esc(inv.customer?.name || "there")},</p>
    <p>Thank you for your order! Your invoice <b>${esc(inv.id)}</b> for order
    <b>${esc(inv.orderId)}</b> is attached as a PDF.</p>
    <p><b>Total paid:</b> ${esc(rupee(inv.total))}<br/>
    <b>Payment:</b> ${esc(inv.payment)}</p>
    <p>We'll keep you posted as your handmade order is prepared and shipped.</p>`;

  const res = await sendMail({
    to,
    subject: `Your Dillora invoice ${inv.id} (Order ${inv.orderId})`,
    html: emailLayout("Your invoice", bodyHtml),
    attachments: [{ filename: `${inv.id}.pdf`, content: pdf }],
  });

  if (res.ok) {
    await Invoice.updateOne({ id: inv.id }, { $set: { emailedAt: Date.now(), emailedTo: to } });
  }
  return res;
}
