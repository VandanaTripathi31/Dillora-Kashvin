import { CATEGORIES, PRODUCTS } from '@/data/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kashvin.in';

export default function sitemap() {
  const now = new Date();
  const entry = (path, priority, changeFrequency = 'weekly') => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
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

  const categoryPages = CATEGORIES.flatMap(c => [
    entry(`/c/${c.id}`, 0.8),
    ...c.subs.map(s => entry(`/c/${c.id}/${s.id}`, 0.6)),
  ]);

  const productPages = PRODUCTS.map(p => entry(`/product/${p.id}`, 0.7));

  return [...staticPages, ...categoryPages, ...productPages];
}
