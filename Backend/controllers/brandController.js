import Brand from "../models/Brand.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { slugify } from "../utils/validators.js";

const byOrder = (a, b) => (a.order || 0) - (b.order || 0);

// GET /api/brands  (public) — active brands with their active models only.
// Shape kept minimal for the storefront dropdowns.
export const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({ active: true }).sort({ order: 1, createdAt: 1 });
  const out = brands.map((b) => {
    const j = b.toJSON();
    const models = (j.models || [])
      .filter((m) => m.active !== false)
      .sort(byOrder)
      .map((m) => ({ id: m.id, name: m.name }));
    return { id: j.id, name: j.name, models };
  });
  res.json(out);
});

// GET /api/brands/all  (admin) — every brand + model, incl. inactive.
export const getAllBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ order: 1, createdAt: 1 });
  res.json(
    brands.map((b) => {
      const j = b.toJSON();
      j.models = (j.models || []).slice().sort(byOrder);
      return j;
    })
  );
});

// POST /api/brands  { name, active?, order? }
export const createBrand = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Brand name is required." });

  const id = req.body.id ? slugify(req.body.id) : slugify(name);
  if (!id) return res.status(400).json({ error: "Brand name is invalid." });
  if (await Brand.findOne({ id })) {
    return res.status(409).json({ error: "That brand already exists." });
  }

  const count = await Brand.countDocuments();
  const brand = await Brand.create({
    id,
    name,
    active: req.body.active !== undefined ? !!req.body.active : true,
    order: req.body.order ?? count,
    models: [],
  });
  res.status(201).json(brand.toJSON());
});

// PUT /api/brands/:id  { name?, active?, order? }
export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findOne({ id: req.params.id });
  if (!brand) return res.status(404).json({ error: "Brand not found." });

  if (req.body.name !== undefined) brand.name = String(req.body.name).trim();
  if (req.body.active !== undefined) brand.active = !!req.body.active;
  if (req.body.order !== undefined) brand.order = Number(req.body.order) || 0;
  await brand.save();
  res.json(brand.toJSON());
});

// DELETE /api/brands/:id
export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findOneAndDelete({ id: req.params.id });
  if (!brand) return res.status(404).json({ error: "Brand not found." });
  res.json({ ok: true });
});

// POST /api/brands/:brandId/models  { name, active?, order? }
export const addModel = asyncHandler(async (req, res) => {
  const clean = String(req.body.name || "").trim();
  if (!clean) return res.status(400).json({ error: "Model name is required." });

  const brand = await Brand.findOne({ id: req.params.brandId });
  if (!brand) return res.status(404).json({ error: "Brand not found." });

  if (brand.models.some((m) => m.name.toLowerCase() === clean.toLowerCase())) {
    return res.status(409).json({ error: "That model already exists." });
  }
  const id = `${slugify(clean)}-${Date.now().toString().slice(-4)}`;
  brand.models.push({
    id,
    name: clean,
    active: req.body.active !== undefined ? !!req.body.active : true,
    order: req.body.order ?? brand.models.length,
  });
  await brand.save();
  res.status(201).json(brand.toJSON());
});

// PUT /api/brands/:brandId/models/:modelId  { name?, active?, order? }
export const updateModel = asyncHandler(async (req, res) => {
  const brand = await Brand.findOne({ id: req.params.brandId });
  if (!brand) return res.status(404).json({ error: "Brand not found." });

  const model = brand.models.find((m) => m.id === req.params.modelId);
  if (!model) return res.status(404).json({ error: "Model not found." });

  if (req.body.name !== undefined) model.name = String(req.body.name).trim();
  if (req.body.active !== undefined) model.active = !!req.body.active;
  if (req.body.order !== undefined) model.order = Number(req.body.order) || 0;
  await brand.save();
  res.json(brand.toJSON());
});

// DELETE /api/brands/:brandId/models/:modelId
export const removeModel = asyncHandler(async (req, res) => {
  const brand = await Brand.findOne({ id: req.params.brandId });
  if (!brand) return res.status(404).json({ error: "Brand not found." });

  const before = brand.models.length;
  brand.models = brand.models.filter((m) => m.id !== req.params.modelId);
  if (brand.models.length === before) {
    return res.status(404).json({ error: "Model not found." });
  }
  await brand.save();
  res.json({ ok: true });
});
