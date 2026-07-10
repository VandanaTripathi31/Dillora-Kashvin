import "dotenv/config";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { dbConnection } from "./config/dbConnection.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";

config({ override: true });

const IS_PROD = process.env.NODE_ENV === "production";

// --- Fail fast on missing critical secrets (avoids a silent launch-day outage) ---
if (!process.env.JWT_SECRET) {
  console.error("[server] FATAL: JWT_SECRET is not set — auth/admin login cannot work. Set it and restart.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Behind Render/Vercel the real client IP is in X-Forwarded-For — needed for
// correct per-IP rate limiting.
app.set("trust proxy", 1);

// --- Security headers. CORP disabled so the separate frontend origin can read
//     API responses (CORS handles cross-origin access). ---
app.use(helmet({ crossOriginResourcePolicy: false }));

// --- CORS: allow the frontend + dashboard origins (comma-separated FRONTEND_URL) ---
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (IS_PROD && allowedOrigins.length === 0) {
  console.warn("[server] WARNING: FRONTEND_URL is not set — in production all cross-origin browser requests will be blocked. Set it to your Vercel URLs.");
}

app.use(
  cors({
    origin(origin, cb) {
      // No Origin header = same-origin / curl / server-to-server → allow.
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // No allow-list configured: permissive in dev, closed in production
      // (fail closed — never reflect arbitrary origins with credentials).
      if (allowedOrigins.length === 0 && !IS_PROD) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Rate limiting: a broad per-IP cap on the whole API, plus a strict cap on
//     login (brute-force) and public writes/uploads (abuse/cost). ---
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: "Too many attempts. Please wait a few minutes and try again." } });
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false, message: { error: "Too many requests. Please slow down and try again shortly." } });

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
// Public write/upload endpoints that cost money or write data.
app.use("/api/upload", writeLimiter);
app.use("/api/reviews", (req, res, next) => (req.method === "POST" ? writeLimiter(req, res, next) : next()));
app.use("/api/feedback", (req, res, next) => (req.method === "POST" ? writeLimiter(req, res, next) : next()));

// --- Health check ---
app.get("/api/health", (req, res) =>
  res.json({ ok: true, service: "dillora-api" }),
);

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/policy", policyRoutes);

// --- Errors ---
app.use(notFound);
app.use(errorHandler);

// --- Start ---
dbConnection().then(() => {
  app.listen(PORT, () =>
    console.log(`[server] Dillora API running on http://localhost:${PORT}`),
  );
});
