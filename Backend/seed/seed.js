// ============================================================
// Dillora — database seeder
//   npm run seed            seed/refresh all collections
//   npm run seed:destroy    wipe all collections
//
// The product & category catalog is imported directly from the frontend
// so there is a single source of truth. Images keep their /images/... paths;
// run `npm run migrate:images` afterwards to move them to Cloudinary.
// ============================================================
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { dbConnection } from "../config/dbConnection.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Video from "../models/Video.js";
import Setting from "../models/Setting.js";
import Order from "../models/Order.js";
import Admin from "../models/Admin.js";

import { COUPONS, VIDEOS, SETTINGS, DEMO_ORDERS } from "./seedData.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.resolve(__dirname, "../../Frontend/data/catalog.js");

async function loadCatalog() {
  const mod = await import(pathToFileURL(CATALOG_PATH).href);
  return { CATEGORIES: mod.CATEGORIES, PRODUCTS: mod.PRODUCTS };
}

async function destroy() {
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    Video.deleteMany({}),
    Setting.deleteMany({}),
    Order.deleteMany({}),
  ]);
  console.log("[seed] All product data collections wiped (admins kept).");
}

async function seed() {
  const { CATEGORIES, PRODUCTS } = await loadCatalog();
  console.log(`[seed] Loaded ${CATEGORIES.length} categories, ${PRODUCTS.length} products from frontend catalog.`);

  // Categories — upsert by id, ensure subs carry a `custom` flag.
  for (const [i, c] of CATEGORIES.entries()) {
    await Category.updateOne(
      { id: c.id },
      {
        $set: {
          id: c.id,
          name: c.name,
          tagline: c.tagline || "",
          order: i,
          subs: (c.subs || []).map((s) => ({ id: s.id, name: s.name, custom: !!s.custom })),
        },
      },
      { upsert: true }
    );
  }

  // Products — upsert by id.
  for (const p of PRODUCTS) {
    await Product.updateOne({ id: p.id }, { $set: p }, { upsert: true });
  }

  // Coupons
  for (const c of COUPONS) {
    await Coupon.updateOne({ code: c.code }, { $set: c }, { upsert: true });
  }

  // Videos
  for (const v of VIDEOS) {
    await Video.updateOne({ id: v.id }, { $set: v }, { upsert: true });
  }

  // Settings (singleton)
  await Setting.updateOne({ key: "site" }, { $setOnInsert: SETTINGS }, { upsert: true });

  // Demo orders (only if none exist yet)
  if ((await Order.countDocuments()) === 0) {
    await Order.insertMany(DEMO_ORDERS);
  }

  // Default admin from env
  await ensureAdmin();

  console.log("[seed] Done.");
}

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";
  if (!email || !password) {
    console.warn("[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin creation.");
    return;
  }
  const exists = await Admin.findOne({ email });
  if (exists) {
    console.log(`[seed] Admin already exists: ${email}`);
    return;
  }
  await Admin.create({ name, email, password });
  console.log(`[seed] Created admin: ${email}`);
}

async function run() {
  await dbConnection();
  const shouldDestroy = process.argv.includes("--destroy");
  if (shouldDestroy) await destroy();
  else await seed();
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
