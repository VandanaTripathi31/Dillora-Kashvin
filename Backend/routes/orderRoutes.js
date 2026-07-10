import { Router } from "express";
import {
  getOrders,
  getOrdersByPhone,
  trackOrder,
  createOrder,
  updateOrderStatus,
  requestCancellation,
  decideCancellation,
  updateRefund,
  collectBalance,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Customer: place an order, look up own orders by phone, request a cancellation.
router.post("/", createOrder);
router.get("/by-phone/:phone", getOrdersByPhone);
router.get("/:id/track", trackOrder);
router.post("/:id/cancel", requestCancellation);

// Admin: view all orders, change status, decide cancellations, track refunds.
router.get("/", protect, getOrders);
router.put("/:id/status", protect, updateOrderStatus);
router.put("/:id/cancellation", protect, decideCancellation);
router.put("/:id/refund", protect, updateRefund);
router.put("/:id/collect-balance", protect, collectBalance);

export default router;
