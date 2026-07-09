import Setting from "../models/Setting.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { timeId } from "../services/idService.js";

async function getOrCreate() {
  let doc = await Setting.findOne({ key: "site" });
  if (!doc) doc = await Setting.create({ key: "site" });
  return doc;
}

// GET /api/settings
export const getSettings = asyncHandler(async (req, res) => {
  const doc = await getOrCreate();
  res.json(doc.toJSON());
});

// PUT /api/settings
// Partial patch: { banner?, showDiscounts?, delivery?, adBanners? }
export const updateSettings = asyncHandler(async (req, res) => {
  const doc = await getOrCreate();
  const patch = req.body || {};

  if (patch.banner && typeof patch.banner === "object") {
    doc.banner = {
      ...(doc.banner.toObject?.() ?? doc.banner),
      ...patch.banner,
    };
  }
  if (patch.showDiscounts !== undefined)
    doc.showDiscounts = !!patch.showDiscounts;
  if (patch.hero && typeof patch.hero === "object") {
    const cur = doc.hero?.toObject?.() ?? doc.hero ?? {};
    const h = patch.hero;
    const str = (k, max = 300) =>
      h[k] !== undefined ? String(h[k] || "").slice(0, max) : cur[k];
    doc.hero = {
      enabled: h.enabled !== undefined ? !!h.enabled : cur.enabled,
      headline: str("headline"),
      subheadline: str("subheadline"),
      ctaText: str("ctaText"),
      ctaLink: str("ctaLink"),
      cta2Text: str("cta2Text"),
      cta2Link: str("cta2Link"),
      imageDesktop: str("imageDesktop", 500),
      imageMobile: str("imageMobile", 500),
      bgColor: str("bgColor", 60),
      overlay:
        h.overlay !== undefined
          ? Math.max(0, Math.min(100, Number(h.overlay) || 0))
          : cur.overlay,
    };
  }
  if (patch.feedbackPopup && typeof patch.feedbackPopup === "object") {
    const cur = doc.feedbackPopup?.toObject?.() ?? doc.feedbackPopup ?? {};
    const f = patch.feedbackPopup;
    doc.feedbackPopup = {
      enabled: f.enabled !== undefined ? !!f.enabled : cur.enabled,
      question:
        f.question !== undefined
          ? String(f.question).slice(0, 200)
          : cur.question,
    };
  }
  if (patch.reviewReward && typeof patch.reviewReward === "object") {
    const cur = doc.reviewReward?.toObject?.() ?? doc.reviewReward ?? {};
    const rr = patch.reviewReward;
    doc.reviewReward = {
      enabled: rr.enabled !== undefined ? !!rr.enabled : cur.enabled,
      percent:
        rr.percent !== undefined
          ? Math.max(1, Math.min(90, Number(rr.percent) || 10))
          : cur.percent,
      days:
        rr.days !== undefined ? Math.max(1, Number(rr.days) || 30) : cur.days,
    };
  }
  if (patch.saleCountdown && typeof patch.saleCountdown === "object") {
    const cur = doc.saleCountdown?.toObject?.() ?? doc.saleCountdown ?? {};
    const p = patch.saleCountdown;
    doc.saleCountdown = {
      enabled: p.enabled !== undefined ? !!p.enabled : cur.enabled,
      text: p.text !== undefined ? String(p.text).slice(0, 120) : cur.text,
      endsAt: p.endsAt !== undefined ? Number(p.endsAt) || 0 : cur.endsAt,
    };
  }
  if (patch.whatsappNumber !== undefined)
    doc.whatsappNumber = String(patch.whatsappNumber || "").replace(
      /[^\d]/g,
      "",
    );
  if (patch.whatsappTemplate !== undefined)
    doc.whatsappTemplate = String(patch.whatsappTemplate || "").slice(0, 500);
  if (patch.instagramUrl !== undefined)
    doc.instagramUrl = String(patch.instagramUrl || "").trim();

  // Delivery/policy info — deep-merge so partial updates keep other fields.
  if (patch.delivery && typeof patch.delivery === "object") {
    doc.delivery = {
      ...(doc.delivery.toObject?.() ?? doc.delivery),
      ...patch.delivery,
    };
  }

  // Invoice/seller/GST details — deep-merge.
  if (patch.invoice && typeof patch.invoice === "object") {
    doc.invoice = {
      ...(doc.invoice.toObject?.() ?? doc.invoice),
      ...patch.invoice,
    };
  }

  // Image popups — deep-merge each popup so partial updates keep other fields.
  if (patch.popups && typeof patch.popups === "object") {
    const cur = doc.popups?.toObject?.() ?? doc.popups ?? {};
    const merge = (a = {}, b = {}) => ({ ...a, ...b });
    doc.popups = {
      welcome: merge(cur.welcome, patch.popups.welcome),
      order: merge(cur.order, patch.popups.order),
      promo: merge(cur.promo, patch.popups.promo),
    };
  }

  // Advertising banners — replace the whole list; ensure every entry has an id.
  if (Array.isArray(patch.adBanners)) {
    doc.adBanners = patch.adBanners.map((b) => ({
      id: b.id || timeId("ad"),
      title: b.title || "",
      subtitle: b.subtitle || "",
      offerText: b.offerText || "",
      couponCode: String(b.couponCode || "")
        .toUpperCase()
        .trim(),
      ctaText: b.ctaText || "",
      ctaLink: b.ctaLink || "",
      countdownEndsAt: Number(b.countdownEndsAt) || 0,
      bgColor: b.bgColor || "",
      imageDesktop: b.imageDesktop || "",
      imageMobile: b.imageMobile || "",
      startDate: Number(b.startDate) || 0,
      endDate: Number(b.endDate) || 0,
      image: b.image || "",
      link: b.link || "",
      alt: b.alt || "",
      active: b.active !== undefined ? !!b.active : true,
      order: Number(b.order) || 0,
    }));
  }

  await doc.save();
  res.json(doc.toJSON());
});
