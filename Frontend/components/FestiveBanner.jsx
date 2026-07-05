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
    <div className="relative flex items-center justify-center gap-4 py-[9px] pl-4 pr-11 text-center text-[0.9rem] font-semibold text-white" style={{ background: preset.bg }}>
      <span>{text}</span>
      {banner.code && (
        <span className="rounded-full bg-white/[.22] px-2.5 py-0.5 text-[0.82rem]">Use code <strong>{banner.code}</strong></span>
      )}
      <button className="absolute right-3 border-none bg-transparent text-[0.9rem] text-white opacity-85 transition-opacity hover:opacity-100" aria-label="Dismiss" onClick={() => setClosed(true)}>✕</button>
    </div>
  );
}
