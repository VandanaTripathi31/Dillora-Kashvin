import { Router } from "express";
import { login, me, register, listAdmins, changePassword } from "../controllers/authController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", protect, me);
router.put("/password", protect, changePassword);
router.get("/admins", protect, requireRole("owner", "manager"), listAdmins);
// Only owners/managers may add admins (prevents staff self-promotion).
router.post("/register", protect, requireRole("owner", "manager"), register);

export default router;
