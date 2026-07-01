'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { SearchX, Sparkles } from 'lucide-react';
import { api } from '@/data/api';
import { useCategories } from '@/context/CategoriesContext';

export default function Search({ open, onClose }) {
  const [all, setAll] = useState([]);
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  const router = useRouter();
  const { categories } = useCategories();
  const catName = (id) => categories.find(c => c.id === id)?.name || '';

  useEffect(() => { if (open) api.getProducts().then(setAll); }, [open]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); else setQ(''); }, [open]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const term = q.trim().toLowerCase();
  const results = term
    ? all.filter(p =>
        p.name.toLowerCase().includes(term) ||
        catName(p.category).toLowerCase().includes(term)
      ).slice(0, 8)
    : [];

  const goto = (id) => { onClose(); router.push(`/product/${id}`); };

  return (
    <div className="searchoverlay" onClick={onClose}>
      <div className="searchbox" onClick={e => e.stopPropagation()}>
        <div className="searchbox__input">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
                 placeholder="Search covers, charms, crochet, resin art…" />
          <button className="cartdrawer__close" onClick={onClose} aria-label="Close search">✕</button>
        </div>
        <div className="searchbox__results">
          {term && results.length === 0 && (
            <div className="searchempty">
              <span className="searchempty__icon"><SearchX className="w-6 h-6" /></span>
              <strong>No matches for “{q}”</strong>
              <span>Try a different word, or browse our categories instead.</span>
            </div>
          )}
          {!term && (
            <div className="searchempty">
              <span className="searchempty__icon"><Sparkles className="w-6 h-6" /></span>
              <strong>Find something handmade</strong>
              <span>Search covers, charms, crochet, resin art &amp; tees.</span>
            </div>
          )}
          {results.map(p => (
            <button key={p.id} className="searchres" onClick={() => goto(p.id)} aria-label={`View ${p.name}`}>
              <img src={p.image} alt="" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="searchres__name">{p.name}</div>
                <div className="searchres__cat">{catName(p.category)}</div>
              </div>
              <span className="price">₹{p.price.toLocaleString('en-IN')}</span>
            </button>
          ))}
        </div>
        {results.length > 0 && (
          <div className="searchbox__hint"><span>Showing {results.length} result{results.length === 1 ? '' : 's'}</span><span><kbd>Esc</kbd> to close</span></div>
        )}
      </div>
    </div>
  );
}
