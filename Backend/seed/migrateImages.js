// ============================================================
// Dillora — migrate local product images to Cloudinary
//   npm run migrate:images
//
// Reads every product in the DB, uploads any image/gallery entry that is
// still a local "/images/..." path to Cloudinary, and rewrites the URL.
// Idempotent: already-migrated (http) URLs are skipped, so it is safe to
// re-run. Requires CLOUDINARY_* env vars and the image files under
// ../../Frontend/public.
// ============================================================
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { dbConnection } from "../config/dbConnection.js";
import { uploadBuffer, isCloudinaryConfigured } from "../config/cloudinary.js";
import Product from "../models/Product.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../../Frontend/public");

const cache = new Map(); // localPath -> { url, publicId }

const isLocal = (u) => typeof u === "string" && u.startsWith("/");

async function migrateOne(localPath) {
  if (cache.has(localPath)) return cache.get(localPath);

  const filePath = path.join(PUBLIC_DIR, decodeURIComponent(localPath));
  if (!fs.existsSync(filePath)) {
    console.warn(`[migrate] missing file, leaving as-is: ${localPath}`);
    const passthrough = { url: localPath, publicId: undefined };
    cache.set(localPath, passthrough);
    return passthrough;
  }
  const buffer = fs.readFileSync(filePath);
  // Preserve a stable folder structure in Cloudinary based on the local path.
  const folder = "dillora" + path.dirname(localPath).replace(/\\/g, "/");
  const result = await uploadBuffer(buffer, { folder, resourceType: "image" });
  const out = { url: result.url, publicId: result.publicId };
  cache.set(localPath, out);
  console.log(`[migrate] ${localPath} -> ${result.url}`);
  return out;
}

async function run() {
  if (!isCloudinaryConfigured()) {
    console.error("[migrate] Cloudinary is not configured. Set CLOUDINARY_* in .env first.");
    process.exit(1);
  }
  await dbConnection();

  const products = await Product.find();
  let changed = 0;

  for (const p of products) {
    let touched = false;

    if (isLocal(p.image)) {
      const { url, publicId } = await migrateOne(p.image);
      p.image = url;
      if (publicId) p.imagePublicId = publicId;
      touched = true;
    }

    if (Array.isArray(p.gallery) && p.gallery.some(isLocal)) {
      const newGallery = [];
      for (const g of p.gallery) {
        newGallery.push(isLocal(g) ? (await migrateOne(g)).url : g);
      }
      p.gallery = newGallery;
      touched = true;
    }

    if (touched) {
      await p.save();
      changed++;
    }
  }

  console.log(`[migrate] Done. Updated ${changed} product(s), uploaded ${cache.size} unique image(s).`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
