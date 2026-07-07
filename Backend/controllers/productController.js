import Product from "../models/Product.js";
import StockLog from "../models/StockLog.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { nextProductId } from "../services/idService.js";
import { logStockChange } from "../services/stockService.js";

/**
 * Whether this admin may edit a (possibly locked) product. Unlocked products
 * are editable by any admin. Locked products are editable only by owner/manager
 * roles or the specifically assigned editor.
 */
function canEditLocked(admin, product) {
  if (!product.stockLock?.locked) return true;
  const role = admin?.role || "owner";
  if (role === "owner" || role === "manager") return true;
  return !!admin?.email && admin.email === product.stockLock.editorEmail;
}

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

  // Stock-lock guard: locked products can only be edited by authorised admins.
  if (!canEditLocked(req.admin, product)) {
    return res.status(403).json({
      error: "This product is locked. Ask an owner/manager or the assigned editor to make changes.",
    });
  }

  // The lock itself is managed through the dedicated lock/unlock endpoints.
  const { id, _id, stockLock, ...patch } = req.body;
  const prevStock = product.stock;
  Object.assign(product, patch);
  await product.save();

  // Audit + notify on stock changes only. Best-effort — never blocks the edit.
  if (Object.prototype.hasOwnProperty.call(patch, "stock") && product.stock !== prevStock) {
    const actor = req.admin?.name || req.admin?.email || "admin";
    await logStockChange({
      productId: product.id,
      productName: product.name,
      oldStock: prevStock,
      newStock: product.stock,
      reason: "admin-edit",
      actor,
    });
  }

  res.json(product.toJSON());
});

// DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ id: req.params.id });
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json({ ok: true });
});

// PUT /api/products/:id/lock  { editorEmail? }   (owner/manager)
export const lockProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: req.params.id });
  if (!product) return res.status(404).json({ error: "Product not found." });

  product.stockLock = {
    locked: true,
    editorEmail: String(req.body?.editorEmail || "").toLowerCase().trim(),
    lockedBy: req.admin?.name || req.admin?.email || "admin",
    lockedAt: Date.now(),
  };
  await product.save();
  res.json(product.toJSON());
});

// PUT /api/products/:id/unlock   (owner/manager)
export const unlockProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: req.params.id });
  if (!product) return res.status(404).json({ error: "Product not found." });

  product.stockLock = { locked: false, editorEmail: "", lockedBy: "", lockedAt: 0 };
  await product.save();
  res.json(product.toJSON());
});

// PUT /api/products/:id/editor  { editorEmail }   (owner/manager)
export const setProductEditor = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: req.params.id });
  if (!product) return res.status(404).json({ error: "Product not found." });

  product.stockLock.editorEmail = String(req.body?.editorEmail || "").toLowerCase().trim();
  await product.save();
  res.json(product.toJSON());
});

// GET /api/products/:id/stock-history   (admin) — recent stock changes
export const getStockHistory = asyncHandler(async (req, res) => {
  const logs = await StockLog.find({ productId: req.params.id })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(logs.map((l) => l.toJSON()));
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
