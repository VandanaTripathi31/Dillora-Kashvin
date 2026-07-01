'use client';

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <div className="spinner__dot" />
      <div className="spinner__dot" />
      <div className="spinner__dot" />
      <span className="sr-only" style={{ position: 'absolute', left: -9999 }}>{label}</span>
    </div>
  );
}

export function Logo({ size = 24, light = false }) {
  if (light) {
    return (
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.02 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size, letterSpacing: '.3px', color: '#fff' }}>
          Dillora
        </span>
        <span style={{ fontSize: size * 0.38, color: 'rgba(255,255,255,.8)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
          by Kashvin
        </span>
      </span>
    );
  }
  return (
    <img src="/logo.png" alt="Dillora by Kashvin" style={{ height: size * 2.15, width: 'auto', display: 'block' }} />
  );
}
