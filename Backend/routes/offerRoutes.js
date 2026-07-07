import { Router } from "express";
import {
  evaluate,
  getActiveOffers,
  listOffers,
  createOffer,
  updateOffer,
  deleteOffer,
} from "../controllers/offerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public — auto-apply evaluation + active offers for display.
router.post("/evaluate", evaluate);
router.get("/active", getActiveOffers);

// Admin CRUD.
router.get("/", protect, listOffers);
router.post("/", protect, createOffer);
router.put("/:id", protect, updateOffer);
router.delete("/:id", protect, deleteOffer);

export default router;
