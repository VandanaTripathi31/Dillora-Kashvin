import CategoryClient from './CategoryClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kashvin.in';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Live categories (for metadata only). Revalidates hourly; null on failure so
// metadata falls back to the site defaults.
async function getCategories() {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { catId } = await params;
  const cats = await getCategories();
  const cat = Array.isArray(cats) ? cats.find((c) => c.id === catId) : null;
  if (!cat) {
    return { alternates: { canonical: `/c/${catId}` } };
  }

  const title = cat.name;
  const description =
    cat.tagline ||
    `Shop handmade ${cat.name} by Dillora by Kashvin — made to order in India. Free shipping on prepaid orders; pay by UPI, cards, net banking or COD.`;
  const url = `/c/${catId}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: `${title} · Dillora by Kashvin`,
      description,
      url,
      images: [{ url: '/logo.png', alt: `${cat.name} — Dillora by Kashvin` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · Dillora by Kashvin`,
      description,
      images: ['/logo.png'],
    },
  };
}

export default function Page() {
  return <CategoryClient />;
}
