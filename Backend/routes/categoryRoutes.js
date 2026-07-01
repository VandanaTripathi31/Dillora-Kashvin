import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addSub,
  renameSub,
  removeSub,
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public read
router.get("/", getCategories);

// Admin writes
router.post("/", protect, createCategory);
router.put("/:id", protect, updateCategory);
router.delete("/:id", protect, deleteCategory);

router.post("/:categoryId/subs", protect, addSub);
router.put("/:categoryId/subs/:subId", protect, renameSub);
router.delete("/:categoryId/subs/:subId", protect, removeSub);

export default router;
