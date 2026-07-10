'use client';
import { useEffect, useRef } from 'react';

// Top scroll-progress bar. Writes the transform straight to the DOM via
// requestAnimationFrame instead of React state, so scrolling never triggers a
// re-render — it stays smooth on low-end phones. Multiple scroll events in the
// same frame are coalesced into a single write.
export default function ScrollProgress() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? h.scrollTop / max : 0;
      el.style.transform = `scaleX(${pct})`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return <div ref={ref} className="scrollprog" style={{ transform: 'scaleX(0)' }} aria-hidden="true" />;
}
