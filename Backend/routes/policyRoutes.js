import { Router } from "express";
import {
  getPolicy,
  getAllPolicies,
  upsertPolicy,
  deletePolicy,
} from "../controllers/policyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Admin — list every policy (management screen).
router.get("/", protect, getAllPolicies);

// Public — resolve one category's policy (storefront PDP accordion).
router.get("/:category", getPolicy);

// Admin writes.
router.put("/:category", protect, upsertPolicy);
router.delete("/:category", protect, deletePolicy);

export default router;
