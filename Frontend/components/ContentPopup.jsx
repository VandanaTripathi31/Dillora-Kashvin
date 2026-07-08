'use client';
import { useState, useEffect } from 'react';

const pad = (n) => String(n).padStart(2, '0');
// Content signature — changing any of these re-shows the popup to everyone.
const sigOf = (d) => JSON.stringify([d.heading, d.image, d.couponCode, d.description, d.ctaText]);

function Timer({ endsAt, now }) {
  const ms = endsAt - now;
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const dd = Math.floor(s / 86400);
  const hh = Math.floor((s % 86400) / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return (
    <p className="font-display text-lg font-bold tabular-nums text-ink">
      {dd > 0 && `${pad(dd)} : `}{pad(hh)} : {pad(mm)} : {pad(ss)}
    </p>
  );
}

/**
 * Reusable rich popup (welcome / promo). Renders admin content — heading,
 * description, coupon, countdown, CTA — over a colour/image background. Shows
 * once per content version (localStorage), respects an active-date schedule.
 */
export default function ContentPopup({ data, storageKey, canShow = true }) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!data?.enabled || !canShow) return;
    const nb = Date.now();
    if (data.startDate && nb < data.startDate) return;
    if (data.endDate && nb > data.endDate) return;
    try { if (localStorage.getItem(storageKey) === sigOf(data)) return; } catch { /* ignore */ }
    setOpen(true);
    setNow(nb);
  }, [data, storageKey, canShow]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  if (!open || !data) return null;

  const dismiss = () => {
    try { localStorage.setItem(storageKey, sigOf(data)); } catch { /* ignore */ }
    setOpen(false);
  };

  const claim = async () => {
    if (data.couponCode) {
      try { await navigator.clipboard.writeText(data.couponCode); setCopied(true); } catch { /* ignore */ }
    }
    if (data.ctaLink) { const to = data.ctaLink; dismiss(); window.location.href = to; return; }
    if (!data.couponCode) dismiss();
  };

  const primaryText = data.ctaText || data.buttonText || (data.couponCode ? 'Claim coupon' : 'Shop now');

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-[admFade_.2s_ease]"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label={data.heading || 'Popup'}
    >
      <div
        className="relative w-full max-w-[400px] overflow-hidden rounded-[24px] text-center shadow-[0_30px_80px_rgba(0,0,0,.4)] animate-[admPop_.28s_ease]"
        style={{ background: data.bgColor || 'linear-gradient(160deg,#f4ecff 0%,#fdeaf5 55%,#ffeede 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={dismiss} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-none bg-white/80 text-ink shadow-sm transition-transform hover:scale-105">✕</button>
        {data.image && <img src={data.image} alt="" className="max-h-[220px] w-full object-cover" />}
        <div className="flex flex-col items-center gap-2.5 px-6 pb-7 pt-6">
          {data.heading && <h3 className="font-display text-[1.5rem] font-bold leading-tight text-ink">{data.heading}</h3>}
          {data.description && <p className="text-[0.95rem] leading-relaxed text-ink-soft">{data.description}</p>}
          {data.couponCode && (
            <button onClick={claim} className="cursor-pointer rounded-xl border-2 border-dashed border-orchid-400 bg-white/70 px-5 py-2 font-display text-lg font-bold tracking-wide text-orchid-600" title="Tap to copy">
              {data.couponCode}{copied && <span className="ml-2 text-[0.7rem] font-semibold text-[#2e9e6b]">✓ copied</span>}
            </button>
          )}
          {data.countdownEndsAt > now && <Timer endsAt={data.countdownEndsAt} now={now} />}
          <div className="mt-2 flex w-full flex-col gap-1.5">
            <button onClick={claim} className="btn btn-primary btn-block">{primaryText}</button>
            <button onClick={dismiss} className="cursor-pointer border-none bg-transparent text-[0.85rem] font-semibold text-ink-soft hover:text-ink">Maybe later</button>
          </div>
        </div>
      </div>
    </div>
  );
}
