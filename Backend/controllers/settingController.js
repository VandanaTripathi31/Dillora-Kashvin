import Setting from "../models/Setting.js";
import { asyncHandler } from "../utils/responseHandler.js";

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

// PUT /api/settings  (partial patch: { banner?, showDiscounts? })
export const updateSettings = asyncHandler(async (req, res) => {
  const doc = await getOrCreate();
  const patch = req.body || {};

  if (patch.banner && typeof patch.banner === "object") {
    doc.banner = { ...doc.banner.toObject?.() ?? doc.banner, ...patch.banner };
  }
  if (patch.showDiscounts !== undefined) doc.showDiscounts = !!patch.showDiscounts;

  await doc.save();
  res.json(doc.toJSON());
});
