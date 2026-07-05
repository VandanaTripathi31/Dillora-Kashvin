import { Router } from "express";
import {
  getApprovedFeedback,
  getFeedbackSummary,
  canSubmitFeedback,
  submitFeedback,
  getAllFeedback,
  setApproved,
  deleteFeedback,
} from "../controllers/feedbackController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public / customer
router.get("/", getApprovedFeedback);
router.get("/summary", getFeedbackSummary);
router.get("/can", canSubmitFeedback);
router.post("/", submitFeedback);

// Admin moderation
router.get("/all", protect, getAllFeedback);
router.put("/:id/approve", protect, setApproved);
router.delete("/:id", protect, deleteFeedback);

export default router;
