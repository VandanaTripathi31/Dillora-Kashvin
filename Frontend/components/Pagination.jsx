'use client';

// Compact numbered pager: « ‹ 1 2 3 … › ». Windowed so it stays small even with
// many pages. Reusable across the PDP cross-sell, category listings, etc.
export default function Pagination({ page, totalPages, onPage, className = '' }) {
  if (!totalPages || totalPages <= 1) return null;

  const go = (p) => onPage(Math.max(1, Math.min(totalPages, p)));

  // Show a 5-wide window of page numbers centred on the current page.
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, Math.max(page + 2, 5));
  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);

  const base =
    'grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';
  const off = 'border-[#eee3f3] bg-white text-ink-soft hover:border-orchid-300 hover:text-orchid-600';
  const on = 'border-orchid-500 bg-orchid-500 text-white';

  return (
    <nav className={`mt-6 flex flex-wrap items-center justify-center gap-1.5 ${className}`} aria-label="Pagination">
      <button className={`${base} ${off}`} onClick={() => go(1)} disabled={page <= 1} aria-label="First page">«</button>
      <button className={`${base} ${off}`} onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Previous page">‹</button>
      {start > 1 && <span className="px-1 text-ink-soft">…</span>}
      {nums.map((n) => (
        <button key={n} className={`${base} ${n === page ? on : off}`} onClick={() => go(n)} aria-current={n === page ? 'page' : undefined}>
          {n}
        </button>
      ))}
      {end < totalPages && <span className="px-1 text-ink-soft">…</span>}
      <button className={`${base} ${off}`} onClick={() => go(page + 1)} disabled={page >= totalPages} aria-label="Next page">›</button>
      <button className={`${base} ${off}`} onClick={() => go(totalPages)} disabled={page >= totalPages} aria-label="Last page">»</button>
    </nav>
  );
}
