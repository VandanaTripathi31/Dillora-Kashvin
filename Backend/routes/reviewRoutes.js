import { Router } from "express";
import {
  getReviews,
  getRatingSummary,
  canReview,
  addReview,
  uploadReviewMedia,
  getAllReviews,
  setReviewApproval,
  replyReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

// Admin moderation — declared BEFORE "/:productId" so they aren't shadowed.
router.get("/admin/all", protect, getAllReviews);
router.put("/admin/:id/approve", protect, setReviewApproval);
router.put("/admin/:id/reply", protect, replyReview);
router.delete("/admin/:id", protect, deleteReview);

// Public — reviews are a customer-facing feature.
router.get("/:productId", getReviews);
router.get("/:productId/summary", getRatingSummary);
router.get("/:productId/can", canReview);
router.post("/:productId/upload", upload.single("file"), uploadReviewMedia);
router.post("/:productId", addReview);

export default router;
