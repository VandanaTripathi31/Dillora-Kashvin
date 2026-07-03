import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
} from "../controllers/paymentController.js";

const router = Router();

// Customer-facing: create a Razorpay order, then verify the payment. The order
// is only persisted after the signature is verified server-side.
router.post("/order", createPaymentOrder);
router.post("/verify", verifyPayment);

export default router;
