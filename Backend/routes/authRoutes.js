import { Router } from "express";
import { login, me, register } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", protect, me);
router.post("/register", protect, register);

export default router;
