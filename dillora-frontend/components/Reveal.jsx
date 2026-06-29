'use client';
import { useEffect, useRef, useState } from 'react';

// Wrap any block; it fades + rises into view when scrolled to.
export default function Reveal({ children, delay = 0, as: Tag = 'div', className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // respect reduced motion
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { setShown(true); obs.unobserve(el); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag ref={ref}
         className={`reveal ${shown ? 'reveal--in' : ''} ${className}`}
         style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
