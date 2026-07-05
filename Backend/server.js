import "dotenv/config";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

import { dbConnection } from "./config/dbConnection.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

config({ override: true });

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS: allow the frontend + dashboard origins (comma-separated) ---
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin/no-origin (curl, server-to-server) and whitelisted origins
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        return cb(null, true);
      }
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Health check ---
app.get("/api/health", (req, res) =>
  res.json({ ok: true, service: "dillora-api" }),
);

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/feedback", feedbackRoutes);

// --- Errors ---
app.use(notFound);
app.use(errorHandler);

// --- Start ---
dbConnection().then(() => {
  app.listen(PORT, () =>
    console.log(`[server] Dillora API running on http://localhost:${PORT}`),
  );
});
