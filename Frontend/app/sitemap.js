import { CATEGORIES as STATIC_CATEGORIES, PRODUCTS as STATIC_PRODUCTS } from '@/data/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kashvin.in';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Regenerate the sitemap hourly so products/categories added in the admin
// dashboard show up for search engines without a full redeploy.
export const revalidate = 3600;

async function fetchJson(path) {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // API unreachable at build/revalidate time — caller falls back.
  }
}

export default async function sitemap() {
  const now = new Date();
  const entry = (path, priority, changeFrequency = 'weekly', lastModified = now) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });

  const staticPages = [
    entry('', 1, 'daily'),
    entry('/about', 0.7, 'monthly'),
    entry('/page/shipping', 0.4, 'yearly'),
    entry('/page/returns', 0.4, 'yearly'),
    entry('/page/privacy', 0.4, 'yearly'),
    entry('/page/terms', 0.4, 'yearly'),
  ];

  // Pull the real catalog from the backend (MongoDB). Fall back to the bundled
  // static catalog if the API is unreachable so the sitemap — and the build —
  // never break.
  const [liveCats, liveProducts] = await Promise.all([
    fetchJson('/categories'),
    fetchJson('/products'),
  ]);

  const categories = Array.isArray(liveCats) && liveCats.length ? liveCats : STATIC_CATEGORIES;
  const products = Array.isArray(liveProducts) && liveProducts.length ? liveProducts : STATIC_PRODUCTS;

  const categoryPages = categories.flatMap((c) => [
    entry(`/c/${c.id}`, 0.8),
    ...(Array.isArray(c.subs) ? c.subs.map((s) => entry(`/c/${c.id}/${s.id}`, 0.6)) : []),
  ]);

  const productPages = products.map((p) =>
    entry(`/product/${p.id}`, 0.7, 'weekly', p.updatedAt ? new Date(p.updatedAt) : now)
  );

  return [...staticPages, ...categoryPages, ...productPages];
}
