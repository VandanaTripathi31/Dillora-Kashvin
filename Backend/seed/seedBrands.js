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

  if (force) {
    await Brand.deleteMany({});
    const docs = buildDocs();
    await Brand.insertMany(docs);
    const modelCount = docs.reduce((n, b) => n + b.models.length, 0);
    console.log(`[seed:brands] Wiped + reseeded ${docs.length} brands, ${modelCount} models (--force).`);
  } else {
    // Additive upsert: add new brands and any missing models, keeping admin edits.
    let newBrands = 0;
    let newModels = 0;
    for (const b of BRANDS) {
      const id = slug(b.name);
      const brand = await Brand.findOne({ id });
      if (!brand) {
        const order = await Brand.countDocuments();
        await Brand.create({
          id, name: b.name, active: true, order,
          models: b.models.map((m, j) => ({ id: `${slug(m)}-${j}`, name: m, active: true, order: j })),
        });
        newBrands += 1;
        newModels += b.models.length;
        continue;
      }
      const have = new Set(brand.models.map((m) => m.name.toLowerCase()));
      b.models.forEach((m) => {
        if (have.has(m.toLowerCase())) return;
        have.add(m.toLowerCase());
        brand.models.push({ id: `${slug(m)}-${brand.models.length}`, name: m, active: true, order: brand.models.length });
        newModels += 1;
      });
      await brand.save();
    }
    console.log(`[seed:brands] Upsert complete — added ${newBrands} brands, ${newModels} models.`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed:brands] Failed:", err);
  process.exit(1);
});
