import Order from "../models/Order.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { nextOrderId } from "../services/idService.js";

// GET /api/orders  (protected — admin)
export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders.map((o) => o.toJSON()));
});

// GET /api/orders/by-phone/:phone
export const getOrdersByPhone = asyncHandler(async (req, res) => {
  const phone = req.params.phone;
  const orders = await Order.find({
    $or: [{ "customer.phone": phone }, { userPhone: phone }],
  }).sort({ createdAt: -1 });
  res.json(orders.map((o) => o.toJSON()));
});

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const id = await nextOrderId();
  const order = await Order.create({
    status: "Processing",
    ...req.body,
    id,
    createdAt: Date.now(),
  });
  res.status(201).json(order.toJSON());
});

// PUT /api/orders/:id/status  { status }
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) return res.status(404).json({ error: "Order not found." });
  order.status = req.body.status;
  await order.save();
  res.json(order.toJSON());
});
