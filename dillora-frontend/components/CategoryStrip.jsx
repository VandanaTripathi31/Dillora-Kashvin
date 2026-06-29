'use client';
import Link from 'next/link';
import { CATEGORIES, CATEGORY_IMG } from '@/data/catalog';

// Each category gets its own brand colour for the animated dotted ring
// (see .catcircle__ring::before in app.css).
const CAT_RING = {
  'mobile-covers': '#a64fd6',
  'mobile-charms': '#e57fc4',
  'crochet':       '#8b63ef',
  'resin-art':     '#7a4ff0',
  'tshirts':       '#f5a623',
};

export default function CategoryStrip() {
  return (
    <section className="catcircles container">
      <div className="catcircles__head">
        <span className="catcircles__eyebrow">Explore</span>
        <h2>Shop by category</h2>
      </div>

      <div className="catcircles__row">
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={`/c/${c.id}`} className="catcircle">
            <div className="catcircle__ring" style={{ '--ringc': CAT_RING[c.id] }}>
              <div className="catcircle__img">
                <img src={CATEGORY_IMG[c.id]} alt={c.name} loading="lazy" />
              </div>
            </div>
            <span className="catcircle__label">{c.name}</span>
            <span className="catcircle__count">{c.subs.length} styles</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
