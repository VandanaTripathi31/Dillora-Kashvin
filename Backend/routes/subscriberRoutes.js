import { Router } from "express";
import { subscribe, listSubscribers } from "../controllers/subscriberController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", subscribe);            // public — newsletter signup
router.get("/", protect, listSubscribers); // admin — export list

export default router;
