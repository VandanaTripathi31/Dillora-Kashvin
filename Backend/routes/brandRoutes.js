import { Router } from "express";
import {
  getBrands,
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  addModel,
  addModelsBulk,
  updateModel,
  removeModel,
} from "../controllers/brandController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public read — storefront dropdowns (active brands + models).
router.get("/", getBrands);

// Admin read — full list incl. inactive.
router.get("/all", protect, getAllBrands);

// Admin writes — brands
router.post("/", protect, createBrand);
router.put("/:id", protect, updateBrand);
router.delete("/:id", protect, deleteBrand);

// Admin writes — models within a brand
router.post("/:brandId/models/bulk", protect, addModelsBulk);
router.post("/:brandId/models", protect, addModel);
router.put("/:brandId/models/:modelId", protect, updateModel);
router.delete("/:brandId/models/:modelId", protect, removeModel);

export default router;
