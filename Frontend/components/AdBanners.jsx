'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

const pad = (n) => String(n).padStart(2, '0');
const ext = (url) => (/^https?:/i.test(url) ? { target: '_blank', rel: 'noreferrer' } : {});

function CountBox({ v, l }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-white/20 px-2.5 py-1 backdrop-blur">
      <span className="font-display text-lg font-bold leading-none tabular-nums">{pad(v)}</span>
      <span className="text-[9px] uppercase tracking-wide opacity-80">{l}</span>
    </div>
  );
}

function Countdown({ endsAt, now }) {
  const ms = endsAt - now;
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const dd = Math.floor(s / 86400);
  const hh = Math.floor((s % 86400) / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return (
    <div className="flex items-center gap-1.5">
      {dd > 0 && <><CountBox v={dd} l="Days" /><span className="opacity-60">:</span></>}
      <CountBox v={hh} l="Hrs" /><span className="opacity-60">:</span>
      <CountBox v={mm} l="Min" /><span className="opacity-60">:</span>
      <CountBox v={ss} l="Sec" />
    </div>
  );
}

// Admin-managed promotional banners. Supports rich content (headline, subtitle,
// coupon, countdown, CTA over a colour/image background) and plain image
// banners, with separate mobile/desktop images and an active-date schedule.
export default function AdBanners() {
  const { settings } = useSettings();
  const [now, setNow] = useState(0); // 0 until mounted → hydration-safe
  const [i, setI] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const nb = now || 0;
  const banners = (settings?.adBanners || [])
    .filter((b) => b.active !== false)
    .filter((b) => (!b.startDate || nb >= b.startDate) && (!b.endDate || nb <= b.endDate))
    .filter((b) => b.imageDesktop || b.imageMobile || b.image || b.title || b.offerText)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!now || !banners.length) return null;

  const b = banners[i % banners.length];
  const desktop = b.imageDesktop || b.image || '';
  const mobile = b.imageMobile || b.imageDesktop || b.image || '';
  const cta = b.ctaLink || b.link || '';
  const isRich = !!(b.title || b.subtitle || b.offerText || b.couponCode || b.ctaText || b.countdownEndsAt);

  const dots = banners.length > 1 && (
    <div className="absolute bottom-2.5 left-1/2 z-[2] flex -translate-x-1/2 gap-1.5">
      {banners.map((x, idx) => (
        <button
          key={x.id || idx}
          onClick={() => setI(idx)}
          aria-label={`Show banner ${idx + 1}`}
          className={`h-2 rounded-full transition-all ${idx === (i % banners.length) ? 'w-5 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'}`}
        />
      ))}
    </div>
  );

  // Plain image banner (back-compat).
  if (!isRich) {
    const imgEl = (
      <picture>
        {mobile && mobile !== desktop && <source media="(max-width: 640px)" srcSet={mobile} />}
        <img src={desktop || mobile} alt={b.alt || 'Promotion'} className="h-auto w-full object-cover" loading="lazy" />
      </picture>
    );
    return (
      <div className="container mt-5">
        <div className="relative overflow-hidden rounded-2xl shadow-soft">
          {cta ? <a href={cta} className="block" {...ext(cta)}>{imgEl}</a> : imgEl}
          {dots}
        </div>
      </div>
    );
  }

  // Rich content banner.
  return (
    <div className="container mt-5">
      <div
        className="relative overflow-hidden rounded-2xl shadow-soft"
        style={{ background: b.bgColor || 'linear-gradient(120deg,#7a4ff0,#a64fd6,#e57fc4)' }}
      >
        {(desktop || mobile) && (
          <>
            {desktop && <img src={desktop} alt="" className="absolute inset-0 hidden h-full w-full object-cover sm:block" aria-hidden="true" />}
            {mobile && <img src={mobile} alt="" className="absolute inset-0 h-full w-full object-cover sm:hidden" aria-hidden="true" />}
            <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          </>
        )}
        <div className="relative z-[1] flex flex-col items-start gap-2.5 px-6 py-8 text-white sm:px-10 sm:py-12">
          {(b.offerText || b.title) && (
            <p className="font-display text-[1.6rem] font-bold leading-tight sm:text-4xl">{b.offerText || b.title}</p>
          )}
          {b.subtitle && <p className="text-sm opacity-90 sm:text-base">{b.subtitle}</p>}
          {b.couponCode && (
            <span className="rounded-full border border-dashed border-white/70 bg-white/15 px-3 py-1 text-sm font-bold tracking-wide backdrop-blur">
              Use code: {b.couponCode}
            </span>
          )}
          {b.countdownEndsAt > now && <div className="mt-1"><Countdown endsAt={b.countdownEndsAt} now={now} /></div>}
          {b.ctaText && (
            <a href={cta || '#'} {...ext(cta)} className="mt-2 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-orchid-600 shadow-lg transition-transform hover:-translate-y-0.5">
              {b.ctaText}
            </a>
          )}
        </div>
        {dots}
      </div>
    </div>
  );
}
