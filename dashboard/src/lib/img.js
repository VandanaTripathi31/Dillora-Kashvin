const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000';

// Product images seeded as relative "/images/..." paths live in the storefront's
// public folder, not the dashboard's — so resolve them against the store URL.
// Absolute (Cloudinary/https) URLs pass through unchanged.
export function productImg(src) {
  if (!src) return '';
  return src.startsWith('/') ? `${STORE_URL}${src}` : src;
}
