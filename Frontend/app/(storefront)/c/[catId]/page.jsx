'use client';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useMemo } from 'react';

import { withMeta } from '@/data/catalog';
import { api } from '@/data/api';
import { useAsync } from '@/lib/useAsync';
import { ProductCard, Spinner, Loader, ProductGridSkeleton, ErrorRetry } from '@/components/UI';
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
  const [sort, setSort] = useState('featured');

  const { data: cat, error: catErr, loading: catLoading, retry: catRetry } = useAsync(
    () => api.getCategories().then(list => list.find(c => c.id === catId) || false),
    [catId]
  );

  const { data: items, error: itemsErr, loading: itemsLoading, retry: itemsRetry } = useAsync(
    () => api.getByCategory(catId, subId).then(list => withMeta(list)),
    [catId, subId]
  );

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

  if (catErr) return <div className="container section"><ErrorRetry error={catErr} onRetry={catRetry} /></div>;
  if (catLoading) return <div className="container section"><Spinner /></div>;
  if (!cat) return <div className="container section"><h2>Category not found</h2><Link href="/" className="btn btn-ghost">Back home</Link></div>;

  const activeSub = subId ? cat.subs.find(s => s.id === subId) : null;

  const subtabClass = (on) =>
    `rounded-full border-[1.5px] px-[18px] py-2 text-[0.88rem] font-semibold transition-colors duration-150 ${
      on ? 'border-orchid-500 bg-orchid-500 text-white'
         : 'border-[#eee3f3] bg-white text-ink-soft hover:border-orchid-500 hover:bg-orchid-500 hover:text-white'
    }`;

  return (
    <div className="container section">
      <nav className="mb-[18px] flex flex-wrap gap-2 text-[0.85rem] text-ink-soft [&_a:hover]:text-orchid-600">
        <Link href="/">Home</Link> <span>/</span>
        <Link href={`/c/${cat.id}`}>{cat.name}</Link>
        {activeSub && <><span>/</span> <span>{activeSub.name}</span></>}
      </nav>

      <div className="mb-[22px]">
        <h1 className="text-[2rem]">{activeSub ? activeSub.name : cat.name}</h1>
        <p className="muted">{cat.tagline}</p>
      </div>

      {/* Subcategory tabs */}
      <div className="mb-7 flex flex-wrap gap-2.5">
        <button className={subtabClass(!subId)} onClick={() => router.push(`/c/${cat.id}`)}>All</button>
        {cat.subs.map(s => (
          <button key={s.id} className={subtabClass(subId === s.id)}
                  onClick={() => router.push(`/c/${cat.id}/${s.id}`)}>{s.name}</button>
        ))}
      </div>

      {/* Sort + count bar */}
      {sorted && sorted.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <span className="muted text-[0.9rem]">{sorted.length} {sorted.length === 1 ? 'item' : 'items'}</span>
          <label className="flex items-center gap-2 text-[0.88rem]">
            <span className="muted">Sort by</span>
            <select value={sort} onChange={e => setSort(e.target.value)}
                    className="cursor-pointer rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 py-[9px] font-semibold text-ink focus:border-orchid-500 focus:outline-none">
              {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>
      )}

      <Loader loading={itemsLoading} error={itemsErr} onRetry={itemsRetry} fallback={<ProductGridSkeleton count={8} />}>
        {(sorted || []).length === 0 ? (
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
      </Loader>
    </div>
  );
}
