'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/data/api';

// Scrollable strip of active offers below the header (reference-site style).
// Pulls admin-managed active offers; hidden when there are none.
export default function OfferStrip() {
  const [offers, setOffers] = useState(null);
  const railRef = useRef(null);

  useEffect(() => { api.getActiveOffers().then(setOffers).catch(() => {}); }, []);

  if (!offers?.length) return null;

  const scroll = (dir) => railRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  const arrow = 'hidden shrink-0 sm:grid h-7 w-7 place-items-center rounded-full border border-[#eadff5] bg-white text-orchid-600 hover:bg-[#f6eefc]';

  return (
    <div className="border-b border-[#eee3f3] bg-[#faf3fe]">
      <div className="mx-auto flex max-w-[1240px] items-center gap-2 px-3 py-2">
        <button onClick={() => scroll(-1)} aria-label="Previous offers" className={arrow}>‹</button>
        <div
          ref={railRef}
          className="flex flex-1 gap-2 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {offers.map((o) => (
            <span
              key={o.id}
              className="whitespace-nowrap rounded-full border border-[#eadff5] bg-white px-3.5 py-1.5 text-[0.82rem] font-semibold text-orchid-600"
            >
              🎁 {o.name}{o.description ? ` — ${o.description}` : ''}
            </span>
          ))}
        </div>
        <button onClick={() => scroll(1)} aria-label="Next offers" className={arrow}>›</button>
      </div>
    </div>
  );
}
