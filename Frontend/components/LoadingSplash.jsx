'use client';
import { useEffect, useState } from 'react';

// Branded splash shown briefly while the app boots (first load only per session).
export default function LoadingSplash() {
  // Start false on BOTH server and client so the first render matches (no
  // hydration mismatch). The sessionStorage check runs after mount instead.
  const [gone, setGone] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    let booted = false;
    try { booted = sessionStorage.getItem('dilora_booted') === '1'; } catch {}
    if (booted) { setGone(true); return; }
    const t1 = setTimeout(() => setFade(true), 500);
    const t2 = setTimeout(() => {
      setGone(true);
      try { sessionStorage.setItem('dilora_booted', '1'); } catch {}
    }, 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (gone) return null;

  return (
    <div className={`splash ${fade ? 'splash--out' : ''}`} aria-hidden="true">
      <div className="splash__inner">
        <img src="/logo.png" alt="Dillora by Kashvin" className="splash__logo" />
        <div className="splash__bar"><span /></div>
      </div>
    </div>
  );
}
