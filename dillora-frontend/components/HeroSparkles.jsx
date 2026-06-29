'use client';
import { useState, useEffect } from 'react';

// Subtle, on-brand floating sparkles layered over the hero. Pure CSS animation,
// decorative only (aria-hidden), and respects reduced-motion via CSS.
//
// Sparkle positions use Math.random(), which differs between the server render
// and the browser render. To avoid a hydration mismatch, we generate them only
// in the browser (after mount) — the hero just has no sparkles for the first
// instant, which is invisible to the user.
export default function HeroSparkles({ count = 14 }) {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    setSparkles(
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 4 + Math.random() * 8,
        delay: Math.random() * 6,
        dur: 4 + Math.random() * 5,
      }))
    );
  }, [count]);

  return (
    <div className="sparkles" aria-hidden="true">
      {sparkles.map(s => (
        <span
          key={s.id}
          className="sparkle"
          style={{
            left: `${s.left}%`, top: `${s.top}%`,
            width: s.size, height: s.size,
            animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
