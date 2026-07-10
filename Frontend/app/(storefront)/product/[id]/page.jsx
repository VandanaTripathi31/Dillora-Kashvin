import ProductClient from './ProductClient';
import { findCategory } from '@/data/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kashvin.in';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Server-side product fetch for metadata only (the interactive UI still loads
// its own copy client-side). Revalidates hourly; returns null on any failure so
// metadata gracefully falls back to the site defaults.
async function getProduct(id) {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/products/${encodeURIComponent(id)}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    // Fall back to the site-wide defaults from the root layout.
    return { alternates: { canonical: `/product/${id}` } };
  }

  const cat = findCategory(product.category);
  const catName = cat?.name ? `${cat.name} · ` : '';
  const title = product.name;
  const description =
    product.description ||
    `${product.name} — ${catName}handmade & made to order by Dillora by Kashvin. Free shipping on prepaid orders. Pay by UPI, cards, net banking or COD.`;
  const image = product.image
    ? (product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`)
    : `${SITE_URL}/logo.png`;
  const url = `/product/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: `${title} · Dillora by Kashvin`,
      description,
      url,
      images: [{ url: image, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · Dillora by Kashvin`,
      description,
      images: [image],
    },
  };
}

export default function Page() {
  return <ProductClient />;
}
