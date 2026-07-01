import { asyncHandler } from "../utils/responseHandler.js";
import { uploadBuffer, isCloudinaryConfigured } from "../config/cloudinary.js";

// POST /api/upload  (field: "file")  -> { url, publicId }
export const uploadImage = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({ error: "Cloudinary is not configured on the server." });
  }
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const result = await uploadBuffer(req.file.buffer, {
    folder: req.body.folder || "dillora/products",
    resourceType: "image",
  });
  res.status(201).json({ url: result.url, publicId: result.publicId });
});

// POST /api/upload/video  (field: "file")  -> { url, publicId }
export const uploadVideo = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({ error: "Cloudinary is not configured on the server." });
  }
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const result = await uploadBuffer(req.file.buffer, {
    folder: req.body.folder || "dillora/videos",
    resourceType: "video",
  });
  res.status(201).json({ url: result.url, publicId: result.publicId });
});
