'use client';
import { useEffect, useState } from 'react';
import { api, BANNER_PRESETS } from '@/data/api';

export default function FestiveBanner() {
  const [banner, setBanner] = useState(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getSettings().then(s => { if (alive) setBanner(s.banner); });
    // refresh when admin toggles it (same-tab custom event + storage event)
    const refresh = () => api.getSettings().then(s => { if (alive) setBanner(s.banner); });
    window.addEventListener('dilora:settings', refresh);
    window.addEventListener('storage', refresh);
    return () => { alive = false; window.removeEventListener('dilora:settings', refresh); window.removeEventListener('storage', refresh); };
  }, []);

  if (!banner || !banner.on || closed) return null;

  const preset = BANNER_PRESETS[banner.preset] || BANNER_PRESETS.sale;
  const text = banner.text?.trim() || preset.text;

  return (
    <div className="fbanner" style={{ background: preset.bg }}>
      <span className="fbanner__text">{text}</span>
      {banner.code && (
        <span className="fbanner__code">Use code <strong>{banner.code}</strong></span>
      )}
      <button className="fbanner__close" aria-label="Dismiss" onClick={() => setClosed(true)}>✕</button>
    </div>
  );
}
