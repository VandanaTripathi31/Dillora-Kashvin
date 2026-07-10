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

  useEffect(() => { if (open) api.getSearchIndex().then(setAll).catch(() => {}); }, [open]);
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
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-[rgba(44,35,64,.45)] pt-[12vh]" onClick={onClose}>
      <div className="w-[min(620px,92vw)] animate-[drop_0.18s_ease] overflow-hidden rounded-[30px] bg-white shadow-[0_30px_80px_rgba(80,40,140,.16)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#eee3f3] px-5 py-[18px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
                 className="flex-1 border-none bg-transparent text-[1.1rem] text-ink outline-none"
                 placeholder="Search covers, charms, crochet, resin art…" />
          <button className="border-none bg-transparent text-[1.1rem] text-ink-soft" onClick={onClose} aria-label="Close search">✕</button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {term && results.length === 0 && (
            <div className="flex flex-col items-center gap-2.5 px-5 py-10 text-center text-ink-soft">
              <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#f9f2fd,#f1e2fb)] text-orchid-600"><SearchX className="h-6 w-6" /></span>
              <strong className="font-semibold text-ink">No matches for “{q}”</strong>
              <span className="text-[0.88rem]">Try a different word, or browse our categories instead.</span>
            </div>
          )}
          {!term && (
            <div className="flex flex-col items-center gap-2.5 px-5 py-10 text-center text-ink-soft">
              <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#f9f2fd,#f1e2fb)] text-orchid-600"><Sparkles className="h-6 w-6" /></span>
              <strong className="font-semibold text-ink">Find something handmade</strong>
              <span className="text-[0.88rem]">Search covers, charms, crochet, resin art &amp; tees.</span>
            </div>
          )}
          {results.map(p => (
            <button key={p.id} className="flex w-full cursor-pointer items-center gap-3.5 border-none bg-transparent px-5 py-3 font-[inherit] hover:bg-[#f9f2fd]" onClick={() => goto(p.id)} aria-label={`View ${p.name}`}>
              <img src={p.image} alt="" className="h-12 w-12 rounded-[10px] object-cover" />
              <div className="flex-1 text-left">
                <div className="text-[0.92rem] font-semibold">{p.name}</div>
                <div className="text-[0.78rem] text-ink-soft">{catName(p.category)}</div>
              </div>
              <span className="price">₹{p.price.toLocaleString('en-IN')}</span>
            </button>
          ))}
        </div>
        {results.length > 0 && (
          <div className="flex flex-wrap gap-3.5 border-t border-[#eee3f3] px-5 py-2.5 text-[0.76rem] text-ink-soft"><span>Showing {results.length} result{results.length === 1 ? '' : 's'}</span><span><kbd className="rounded-md border border-[#eee3f3] bg-cream-2 px-1.5 py-px font-body text-[0.72rem]">Esc</kbd> to close</span></div>
        )}
      </div>
    </div>
  );
}
