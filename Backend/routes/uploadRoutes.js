import { Router } from "express";
import { uploadImage, uploadVideo } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

router.post("/", protect, upload.single("file"), uploadImage);
router.post("/video", protect, upload.single("file"), uploadVideo);

export default router;
