'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

// Admin-managed promotional image banners. Shows active banners (sorted by
// `order`); auto-rotates when there's more than one. Returns nothing when none
// are configured, so it's invisible until the admin adds a banner.
export default function AdBanners() {
  const { settings } = useSettings();
  const banners = (settings?.adBanners || [])
    .filter((b) => b.active !== false && b.image)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const [i, setI] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) return null;

  const active = banners[i % banners.length];
  const img = (
    <img
      src={active.image}
      alt={active.alt || 'Promotion'}
      className="h-auto w-full object-cover"
      loading="lazy"
    />
  );

  return (
    <div className="container mt-5">
      <div className="relative overflow-hidden rounded-2xl shadow-soft">
        {active.link ? (
          <a href={active.link} target="_blank" rel="noreferrer" className="block">{img}</a>
        ) : img}

        {banners.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, idx) => (
              <button
                key={b.id || idx}
                onClick={() => setI(idx)}
                aria-label={`Show banner ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === (i % banners.length) ? 'w-5 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
