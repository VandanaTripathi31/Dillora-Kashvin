'use client';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORY_IMG } from '@/data/catalog';
import { useCategories } from '@/context/CategoriesContext';

// Each category gets its own ring colour for the animated dotted ring
// (see .catcircle__ring::before in app.css). All drawn from the "Handmade with
// love" banner palette (deep orchid → violet → pink) so the strip matches it.
const CAT_RING = {
  'mobile-covers': '#8a39bd',
  'mobile-charms': '#e57fc4',
  'crochet':       '#8b63ef',
  'resin-art':     '#7a4ff0',
  'tshirts':       '#a64fd6',
};

export default function CategoryStrip() {
  const { categories } = useCategories();
  return (
    <section className="catcircles container">
      <div className="catcircles__head">
        <span className="catcircles__eyebrow">Explore</span>
        <h2>Shop by category</h2>
      </div>

      <div className="catcircles__row">
        {categories.map((c) => (
          <Link key={c.id} href={`/c/${c.id}`} className="catcircle">
            <div className="catcircle__ring" style={{ '--ringc': CAT_RING[c.id] || '#a64fd6' }}>
              <div className="catcircle__img">
                {/* next/image → optimized WebP/AVIF at the right size; eager (not
                    lazy) so the strip is ready on mobile; a rotating spinner
                    (.catcircle__img::after) shows underneath until it paints. */}
                <Image
                  src={CATEGORY_IMG[c.id] || c.image || '/logo.png'}
                  alt={c.name}
                  fill
                  sizes="(max-width:380px) 80px, (max-width:720px) 92px, 150px"
                  loading="eager"
                  className="object-cover"
                />
              </div>
            </div>
            <span className="catcircle__label">{c.name}</span>
            <span className="catcircle__count">{(c.subs?.length ?? 0)} styles</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
