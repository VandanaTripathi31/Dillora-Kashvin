import { v2 as cloudinary } from "cloudinary";
console.log("CLOUDINARY ENV CHECK:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET ? "present" : "MISSING",
});
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
export const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );

// Inject delivery transforms (auto format → WebP/AVIF, auto quality) into a
// Cloudinary image URL so it's served compressed in a modern format, optionally
// at a target width. No effect on non-Cloudinary/non-image URLs.
export function optimized(url, width) {
  if (typeof url !== "string" || !url.includes("/image/upload/")) return url;
  const t = ["f_auto", "q_auto", ...(width ? [`w_${width}`, "c_limit"] : [])].join(",");
  return url.replace("/image/upload/", `/image/upload/${t}/`);
}

/**
 * Upload an in-memory file buffer to Cloudinary. Images are compressed on the
 * way in (auto quality, capped at 1600px) and pre-rendered into thumbnail/card
 * sizes so the storefront never resizes a full-size original on the fly.
 * @param {Buffer} buffer   file contents (from multer memory storage)
 * @param {object} options  { folder, resourceType }
 * @returns {Promise<{url:string, publicId:string, resourceType:string, sizes?:object}>}
 */
export const uploadBuffer = (
  buffer,
  { folder = "dillora", resourceType = "image" } = {},
) =>
  new Promise((resolve, reject) => {
    const opts = { folder, resource_type: resourceType };
    if (resourceType === "image") {
      // Compress + cap the stored master, and eagerly build smaller renditions.
      opts.transformation = [{ quality: "auto:good", width: 1600, crop: "limit" }];
      opts.eager = [
        { width: 300, crop: "limit" }, // thumbnail
        { width: 800, crop: "limit" }, // card
      ];
    }
    const stream = cloudinary.uploader.upload_stream(opts, (error, result) => {
      if (error) return reject(error);
      const base = result.secure_url;
      resolve({
        url: optimized(base),
        publicId: result.public_id,
        resourceType: result.resource_type,
        sizes:
          resourceType === "image"
            ? { thumb: optimized(base, 300), card: optimized(base, 800), full: optimized(base) }
            : undefined,
      });
    });
    stream.end(buffer);
  });

export default cloudinary;
