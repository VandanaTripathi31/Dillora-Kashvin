// ============================================================
// Standalone phone-brand seeder — populates the `brands` collection only,
// without touching products/orders/etc.
//   node seed/seedBrands.js           seed only if empty (safe)
//   node seed/seedBrands.js --force   wipe brands and reseed from brandsData
// ============================================================
import dotenv from "dotenv";
import mongoose from "mongoose";

import { dbConnection } from "../config/dbConnection.js";
import Brand from "../models/Brand.js";
import { BRANDS } from "./brandsData.js";

dotenv.config();

const slug = (s) =>
  String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function buildDocs() {
  return BRANDS.map((b, i) => ({
    id: slug(b.name),
    name: b.name,
    active: true,
    order: i,
    models: b.models.map((m, j) => ({ id: `${slug(m)}-${j}`, name: m, active: true, order: j })),
  }));
}

async function run() {
  await dbConnection();
  const force = process.argv.includes("--force");
  const existing = await Brand.countDocuments();

  if (existing > 0 && !force) {
    console.log(`[seed:brands] ${existing} brands already present — nothing to do. Use --force to reseed.`);
  } else {
    if (force) {
      await Brand.deleteMany({});
      console.log("[seed:brands] Existing brands wiped (--force).");
    }
    const docs = buildDocs();
    await Brand.insertMany(docs);
    const modelCount = docs.reduce((n, b) => n + b.models.length, 0);
    console.log(`[seed:brands] Seeded ${docs.length} brands, ${modelCount} models.`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed:brands] Failed:", err);
  process.exit(1);
});
