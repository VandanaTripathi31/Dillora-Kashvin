import { Router } from "express";
import {
  getProducts,
  getBestsellers,
  getByCategory,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

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

// Public single read (last, so it doesn't shadow the routes above)
router.get("/:id", getProduct);

export default router;
