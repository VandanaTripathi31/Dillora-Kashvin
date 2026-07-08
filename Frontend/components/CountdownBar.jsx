'use client';
import { useEffect, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';

const pad = (n) => String(n).padStart(2, '0');

// Top countdown sale bar. Admin-managed (settings.saleCountdown). Renders a live
// DD:HH:MM:SS timer until `endsAt`; hides itself when disabled or expired.
export default function CountdownBar() {
  const { settings } = useSettings();
  const sc = settings?.saleCountdown;
  const [now, setNow] = useState(0); // 0 until mounted → hydration-safe (renders nothing on server)

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now || !sc?.enabled || !sc.endsAt) return null;
  const ms = sc.endsAt - now;
  if (ms <= 0) return null;

  const s = Math.floor(ms / 1000);
  const dd = Math.floor(s / 86400);
  const hh = Math.floor((s % 86400) / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const sep = <span className="opacity-50">:</span>;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 bg-[linear-gradient(90deg,#7a4ff0,#a64fd6,#e57fc4)] px-4 py-2 text-center text-sm font-semibold text-white">
      <span>🔥 {sc.text || 'Hurry! Sale ends in'}</span>
      <span className="inline-flex items-center gap-1 font-bold tabular-nums tracking-wide">
        {dd > 0 && <>{pad(dd)}{sep}</>}
        {pad(hh)}{sep}{pad(mm)}{sep}{pad(ss)}
      </span>
    </div>
  );
}
