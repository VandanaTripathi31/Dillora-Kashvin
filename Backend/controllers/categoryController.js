import Category from "../models/Category.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { isNonEmptyString, slugify } from "../utils/validators.js";

// GET /api/categories  -> full categories with subs (matches getCategoriesFull)
export const getCategories = asyncHandler(async (req, res) => {
  const cats = await Category.find().sort({ order: 1, createdAt: 1 });
  res.json(cats.map((c) => c.toJSON()));
});

// POST /api/categories  { name, tagline }
export const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Category name is required." });

  const id = req.body.id ? slugify(req.body.id) : slugify(name);
  if (await Category.findOne({ id })) {
    return res.status(409).json({ error: "That category already exists." });
  }
  const count = await Category.countDocuments();
  const cat = await Category.create({
    id,
    name,
    tagline: req.body.tagline || "",
    order: req.body.order ?? count,
    subs: Array.isArray(req.body.subs) ? req.body.subs : [],
  });
  res.status(201).json(cat.toJSON());
});

// PUT /api/categories/:id  { name?, tagline?, order? }
export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findOne({ id: req.params.id });
  if (!cat) return res.status(404).json({ error: "Category not found." });

  if (req.body.name !== undefined) cat.name = String(req.body.name).trim();
  if (req.body.tagline !== undefined) cat.tagline = req.body.tagline;
  if (req.body.order !== undefined) cat.order = Number(req.body.order) || 0;
  await cat.save();
  res.json(cat.toJSON());
});

// DELETE /api/categories/:id
export const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findOneAndDelete({ id: req.params.id });
  if (!cat) return res.status(404).json({ error: "Category not found." });
  res.json({ ok: true });
});

// POST /api/categories/:categoryId/subs  { name }
export const addSub = asyncHandler(async (req, res) => {
  const clean = String(req.body.name || "").trim();
  if (!clean) return res.status(400).json({ ok: false, error: "Name required" });

  const cat = await Category.findOne({ id: req.params.categoryId });
  if (!cat) return res.status(404).json({ ok: false, error: "Category not found" });

  if (cat.subs.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
    return res.status(409).json({ ok: false, error: "That sub-category already exists" });
  }
  const id = `${slugify(clean)}-${Date.now().toString().slice(-4)}`;
  const sub = { id, name: clean, custom: true };
  cat.subs.push(sub);
  await cat.save();
  res.status(201).json({ ok: true, sub: { id, name: clean } });
});

// PUT /api/categories/:categoryId/subs/:subId  { name }
export const renameSub = asyncHandler(async (req, res) => {
  const clean = String(req.body.name || "").trim();
  if (!clean) return res.status(400).json({ ok: false, error: "Name required" });

  const cat = await Category.findOne({ id: req.params.categoryId });
  if (!cat) return res.status(404).json({ ok: false, error: "Category not found" });

  const sub = cat.subs.find((s) => s.id === req.params.subId);
  if (!sub) return res.status(404).json({ ok: false, error: "Sub-category not found" });
  sub.name = clean;
  await cat.save();
  res.json({ ok: true });
});

// DELETE /api/categories/:categoryId/subs/:subId
export const removeSub = asyncHandler(async (req, res) => {
  const cat = await Category.findOne({ id: req.params.categoryId });
  if (!cat) return res.status(404).json({ ok: false, error: "Category not found" });

  const before = cat.subs.length;
  cat.subs = cat.subs.filter((s) => s.id !== req.params.subId);
  if (cat.subs.length === before) {
    return res.status(404).json({ ok: false, error: "Sub-category not found" });
  }
  await cat.save();
  res.json({ ok: true });
});
