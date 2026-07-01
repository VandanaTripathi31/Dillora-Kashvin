import { Router } from "express";
import {
  getReviews,
  getRatingSummary,
  canReview,
  addReview,
} from "../controllers/reviewController.js";

const router = Router();

// All public — reviews are a customer-facing feature.
router.get("/:productId", getReviews);
router.get("/:productId/summary", getRatingSummary);
router.get("/:productId/can", canReview);
router.post("/:productId", addReview);

export default router;
