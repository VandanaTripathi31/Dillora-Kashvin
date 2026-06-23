'use client';
import { useEffect, useState } from 'react';

// Branded splash shown briefly while the app boots (first load only per session).
export default function LoadingSplash() {
  const [gone, setGone] = useState(() => {
    try { return sessionStorage.getItem('dilora_booted') === '1'; } catch { return false; }
  });
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (gone) return;
    const t1 = setTimeout(() => setFade(true), 900);
    const t2 = setTimeout(() => {
      setGone(true);
      try { sessionStorage.setItem('dilora_booted', '1'); } catch {}
    }, 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [gone]);

  if (gone) return null;

  return (
    <div className={`splash ${fade ? 'splash--out' : ''}`} aria-hidden="true">
      <div className="splash__inner">
        <img src="/logo-header.png" alt="" className="splash__logo" />
        <div className="splash__name">Dillora <span>by Kashvin</span></div>
        <div className="splash__bar"><span /></div>
      </div>
    </div>
  );
}
