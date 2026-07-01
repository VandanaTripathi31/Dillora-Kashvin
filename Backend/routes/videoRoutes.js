import { Router } from "express";
import { getVideos, createVideo, deleteVideo } from "../controllers/videoController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getVideos); // public (storefront reels)
router.post("/", protect, createVideo);
router.delete("/:id", protect, deleteVideo);

export default router;
