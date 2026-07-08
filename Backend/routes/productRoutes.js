import { Router } from "express";
import {
  getProducts,
  getBestsellers,
  getByCategory,
  getProduct,
  getRelated,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
  lockProduct,
  unlockProduct,
  setProductEditor,
  getStockHistory,
} from "../controllers/productController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Public reads — specific paths BEFORE the "/:id" catch-all.
router.get("/", getProducts);
router.get("/bestsellers", getBestsellers);
router.get("/category/:catId", getByCategory);

// Admin writes
router.post("/bulk", protect, bulkCreateProducts);
router.post("/", protect, createProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

// Stock-lock management (owner/manager only) + history (any admin)
router.put("/:id/lock", protect, requireRole("owner", "manager"), lockProduct);
router.put("/:id/unlock", protect, requireRole("owner", "manager"), unlockProduct);
router.put("/:id/editor", protect, requireRole("owner", "manager"), setProductEditor);
router.get("/:id/stock-history", protect, getStockHistory);

// Public cross-sell (specific path before the "/:id" catch-all).
router.get("/:id/related", getRelated);

// Public single read (last, so it doesn't shadow the routes above)
router.get("/:id", getProduct);

export default router;
