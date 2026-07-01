import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getSettings); // public (banner/discount flags)
router.put("/", protect, updateSettings);

export default router;
