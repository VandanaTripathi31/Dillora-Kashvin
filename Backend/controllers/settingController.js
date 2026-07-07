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
    doc.banner = { ...doc.banner.toObject?.() ?? doc.banner, ...patch.banner };
  }
  if (patch.showDiscounts !== undefined) doc.showDiscounts = !!patch.showDiscounts;
  if (patch.whatsappNumber !== undefined) doc.whatsappNumber = String(patch.whatsappNumber || "").replace(/[^\d]/g, "");
  if (patch.instagramUrl !== undefined) doc.instagramUrl = String(patch.instagramUrl || "").trim();

  // Delivery/policy info — deep-merge so partial updates keep other fields.
  if (patch.delivery && typeof patch.delivery === "object") {
    doc.delivery = { ...doc.delivery.toObject?.() ?? doc.delivery, ...patch.delivery };
  }

  // Invoice/seller/GST details — deep-merge.
  if (patch.invoice && typeof patch.invoice === "object") {
    doc.invoice = { ...doc.invoice.toObject?.() ?? doc.invoice, ...patch.invoice };
  }

  // Image popups — deep-merge each popup so partial updates keep other fields.
  if (patch.popups && typeof patch.popups === "object") {
    const cur = doc.popups?.toObject?.() ?? doc.popups ?? {};
    const merge = (a = {}, b = {}) => ({ ...a, ...b });
    doc.popups = {
      welcome: merge(cur.welcome, patch.popups.welcome),
      order: merge(cur.order, patch.popups.order),
    };
  }

  // Advertising banners — replace the whole list; ensure every entry has an id.
  if (Array.isArray(patch.adBanners)) {
    doc.adBanners = patch.adBanners.map((b) => ({
      id: b.id || timeId("ad"),
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
