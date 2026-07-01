import { Router } from "express";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/couponController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Customer: validate a code at checkout.
router.post("/validate", validateCoupon);

// Admin: manage coupons.
router.get("/", protect, getCoupons);
router.post("/", protect, createCoupon);
router.put("/:code", protect, updateCoupon);
router.delete("/:code", protect, deleteCoupon);

export default router;
