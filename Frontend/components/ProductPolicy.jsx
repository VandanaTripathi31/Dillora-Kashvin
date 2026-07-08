'use client';
import { useEffect, useState } from 'react';
import { api } from '@/data/api';

// "Shipping and Return Policy" accordion for the product page. Pulls structured,
// per-category policy content from the backend (admin-editable) and falls back
// to the store-wide "general" policy when a category has none.
export default function ProductPolicy({ category, defaultOpen = false }) {
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    let alive = true;
    api.getPolicy(category).then((p) => { if (alive) setPolicy(p); }).catch(() => {});
    return () => { alive = false; };
  }, [category]);

  const sections = policy?.sections || [];
  if (policy && sections.length === 0) return null;

  return (
    <details className="group border-t border-[#eee3f3] py-3">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 py-1 font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true">🚚</span>
        <span className="flex-1">{policy?.title || 'Shipping and Return Policy'}</span>
        <span className="text-ink-soft transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-2.5 space-y-3.5">
        {sections.map((s, i) => (
          <div key={i}>
            {s.heading && <p className="mb-1 text-[0.9rem] font-semibold text-ink">{s.heading}</p>}
            <ul className="m-0 list-disc pl-[18px] text-[0.88rem] leading-relaxed text-ink-soft [&_li]:mb-1">
              {s.clauses.map((c, j) => <li key={j}>{c}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
