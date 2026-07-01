import { Router } from "express";
import {
  getOrders,
  getOrdersByPhone,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Customer: place an order, look up own orders by phone.
router.post("/", createOrder);
router.get("/by-phone/:phone", getOrdersByPhone);

// Admin: view all orders, change status.
router.get("/", protect, getOrders);
router.put("/:id/status", protect, updateOrderStatus);

export default router;
