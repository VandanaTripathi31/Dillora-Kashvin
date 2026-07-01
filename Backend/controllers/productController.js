import Product from "../models/Product.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { nextProductId } from "../services/idService.js";

// GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: 1 });
  res.json(products.map((p) => p.toJSON()));
});

// GET /api/products/bestsellers?n=8
export const getBestsellers = asyncHandler(async (req, res) => {
  const n = Math.max(1, Math.min(50, Number(req.query.n) || 8));
  const products = await Product.find().sort({ createdAt: 1 }).limit(n);
  res.json(products.map((p) => p.toJSON()));
});

// GET /api/products/category/:catId?sub=subId
export const getByCategory = asyncHandler(async (req, res) => {
  const filter = { category: req.params.catId };
  if (req.query.sub) filter.sub = req.query.sub;
  const products = await Product.find(filter).sort({ createdAt: 1 });
  res.json(products.map((p) => p.toJSON()));
});

// GET /api/products/:id
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: req.params.id });
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json(product.toJSON());
});

// POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.name) return res.status(400).json({ error: "Product name is required." });

  const id = data.id || (await nextProductId());
  const product = await Product.create({
    stock: 0,
    optionType: "none",
    ...data,
    id,
  });
  res.status(201).json(product.toJSON());
});

// PUT /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: req.params.id });
  if (!product) return res.status(404).json({ error: "Product not found." });

  const { id, _id, ...patch } = req.body;
  Object.assign(product, patch);
  await product.save();
  res.json(product.toJSON());
});

// DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ id: req.params.id });
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json({ ok: true });
});

// POST /api/products/bulk  { items: [...] }
export const bulkCreateProducts = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body.items) ? req.body.items : [];
  let count = 0;
  const docs = [];
  for (const r of rows) {
    if (!r.name) continue;
    docs.push({
      id: `p${Date.now()}_${count}`,
      name: r.name,
      category: r.category || "mobile-covers",
      sub: r.sub || "",
      price: Number(r.price) || 0,
      mrp: Number(r.mrp) || 0,
      stock: Number(r.stock) || 0,
      optionType: r.optionType || "none",
      image: r.image || "",
    });
    count++;
  }
  if (docs.length) await Product.insertMany(docs, { ordered: false });
  res.status(201).json({ count });
});
