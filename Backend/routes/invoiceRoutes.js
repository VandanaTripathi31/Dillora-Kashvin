import { Router } from "express";
import {
  listInvoices,
  getInvoice,
  downloadInvoice,
  sendInvoiceEmail,
} from "../controllers/invoiceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// All invoice endpoints are admin-only.
router.get("/", protect, listInvoices);
router.get("/:orderId", protect, getInvoice);
router.get("/:orderId/pdf", protect, downloadInvoice);
router.post("/:orderId/email", protect, sendInvoiceEmail);

export default router;
