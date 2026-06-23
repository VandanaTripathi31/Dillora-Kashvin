'use client';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

import { withMeta } from '@/data/catalog';
import { api } from '@/data/api';
import { ProductCard, Spinner } from '@/components/UI';
import Reveal from '@/components/Reveal';

const SORTS = [
  { id: 'featured',   label: 'Featured' },
  { id: 'price-asc',  label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'newest',     label: 'Newest' },
  { id: 'discount',   label: 'Biggest discount' },
];

function discountPct(p) {
  return p.mrp && p.mrp > p.price ? (1 - p.price / p.mrp) : 0;
}

export default function Category() {
  const { catId, subId } = useParams();
  const router = useRouter();
  const [cat, setCat] = useState(null);
  const [items, setItems] = useState(null);
  const [sort, setSort] = useState('featured');

  useEffect(() => {
    api.getCategories().then(list => setCat(list.find(c => c.id === catId) || false));
  }, [catId]);

  useEffect(() => {
    setItems(null);
    api.getByCategory(catId, subId).then(list => setItems(withMeta(list)));
  }, [catId, subId]);

  const sorted = useMemo(() => {
    if (!items) return null;
    const arr = [...items];
    switch (sort) {
      case 'price-asc':  arr.sort((a, b) => a.price - b.price); break;
      case 'price-desc': arr.sort((a, b) => b.price - a.price); break;
      case 'newest':     arr.sort((a, b) => b._order - a._order); break;
      case 'discount':   arr.sort((a, b) => discountPct(b) - discountPct(a)); break;
      default: break; // featured = natural order
    }
    return arr;
  }, [items, sort]);

  if (cat === null) return <div className="container section"><Spinner /></div>;
  if (!cat) return <div className="container section"><h2>Category not found</h2><Link href="/" className="btn btn-ghost">Back home</Link></div>;

  const activeSub = subId ? cat.subs.find(s => s.id === subId) : null;

  return (
    <div className="container section">
      <nav className="crumbs">
        <Link href="/">Home</Link> <span>/</span>
        <Link href={`/c/${cat.id}`}>{cat.name}</Link>
        {activeSub && <><span>/</span> <span>{activeSub.name}</span></>}
      </nav>

      <div className="cat__header">
        <h1>{activeSub ? activeSub.name : cat.name}</h1>
        <p className="muted">{cat.tagline}</p>
      </div>

      {/* Subcategory tabs */}
      <div className="subtabs">
        <button className={`subtab ${!subId ? 'subtab--on' : ''}`} onClick={() => router.push(`/c/${cat.id}`)}>All</button>
        {cat.subs.map(s => (
          <button key={s.id} className={`subtab ${subId === s.id ? 'subtab--on' : ''}`}
                  onClick={() => router.push(`/c/${cat.id}/${s.id}`)}>{s.name}</button>
        ))}
      </div>

      {/* Sort + count bar */}
      {sorted && sorted.length > 0 && (
        <div className="cat__toolbar">
          <span className="cat__count muted">{sorted.length} {sorted.length === 1 ? 'item' : 'items'}</span>
          <label className="cat__sort">
            <span className="muted">Sort by</span>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>
      )}

      {!sorted ? <Spinner /> :
        sorted.length === 0 ? (
          <div className="empty">
            <p>Nothing here yet — new pieces are on the way.</p>
            <Link href="/" className="btn btn-ghost">Keep browsing</Link>
          </div>
        ) : (
          <div className="grid">
            {sorted.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 50, 300)}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        )}
    </div>
  );
}
