'use client';
import { useState, useEffect } from 'react';
import { api } from '@/data/api';
import { useSettings } from '@/context/SettingsContext';
import ImagePopup from './ImagePopup';

const KEY = 'dilora_howto_seen';

// Shown on a product page. If the admin uploaded a custom image (Dashboard →
// Popups) it shows that; otherwise the built-in illustrated design. Defers to
// the welcome popup so the two never stack.
export default function HowToOrderPopup() {
  const { settings } = useSettings();
  const order = settings?.popups?.order;
  const welcome = settings?.popups?.welcome;

  // Don't open on top of a pending welcome popup.
  const [blocked, setBlocked] = useState(true);
  useEffect(() => {
    try {
      const pending = welcome?.enabled && welcome?.image && localStorage.getItem('dilora_welcome_seen') !== welcome.image;
      setBlocked(!!pending);
    } catch { setBlocked(false); }
  }, [welcome?.enabled, welcome?.image]);

  // Admin can turn the order popup off entirely.
  if (order && order.enabled === false) return null;

  if (order?.steps?.length) {
    return <StepsPopup heading={order.heading} steps={order.steps} buttonText={order.buttonText} canShow={!blocked} />;
  }
  if (order?.image) {
    return <ImagePopup image={order.image} link={order.link} storageKey="dilora_order_seen" canShow={!blocked} />;
  }
  return <IllustratedHowTo canShow={!blocked} />;
}

// Admin-authored step list ("How to order"). Shows once per content version.
function StepsPopup({ heading, steps, buttonText, canShow }) {
  const [open, setOpen] = useState(false);
  const sig = JSON.stringify([heading, steps]);
  useEffect(() => {
    if (!canShow) return;
    try { if (localStorage.getItem('dilora_order_seen') !== sig) setOpen(true); } catch { setOpen(true); }
  }, [sig, canShow]);
  if (!open) return null;
  const dismiss = () => { try { localStorage.setItem('dilora_order_seen', sig); } catch { /* ignore */ } setOpen(false); };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-[admFade_.2s_ease]" onClick={dismiss} role="dialog" aria-modal="true" aria-label={heading || 'How to order'}>
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[24px] p-6 shadow-[0_30px_80px_rgba(0,0,0,.4)] animate-[admPop_.28s_ease]" style={{ background: 'linear-gradient(160deg,#faf4ff,#fdeef7)' }} onClick={(e) => e.stopPropagation()}>
        <button onClick={dismiss} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-none bg-white/80 text-ink shadow-sm hover:scale-105">✕</button>
        <h3 className="mb-4 text-center font-display text-[1.5rem] font-bold text-ink">{heading || '📦 How to order'}</h3>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-grad-brand text-sm font-bold text-white">{s.icon || i + 1}</span>
              <div>
                {s.title && <p className="font-semibold text-ink">{s.title}</p>}
                {s.text && <p className="text-[0.9rem] text-ink-soft">{s.text}</p>}
              </div>
            </li>
          ))}
        </ol>
        <button onClick={dismiss} className="btn btn-primary btn-block mt-5">{buttonText || 'Got it — let’s shop ✨'}</button>
      </div>
    </div>
  );
}

// Soft, illustrated phone-case tiles for the "choose your design" grid.
const CASE_TILES = [
  { bg: 'radial-gradient(#e57fc4 1.6px, transparent 1.7px) 0 0/11px 11px, #fff0f7' },
  { bg: 'linear-gradient(140deg,#a64fd6,#e57fc4)' },
  { bg: 'radial-gradient(#a64fd6 1.5px, transparent 1.6px) 0 0/10px 10px, #f7f0fe' },
  { bg: 'linear-gradient(140deg,#8b63ef,#bd80e0)' },
];

function CaseTile({ bg }) {
  return (
    <div className="relative aspect-[9/15] rounded-[12px] shadow-[0_4px_12px_rgba(120,60,150,.18)]" style={{ background: bg }}>
      {/* camera bump */}
      <div className="absolute left-1.5 top-1.5 grid grid-cols-2 gap-0.5 rounded-md bg-black/10 p-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
      </div>
    </div>
  );
}

function Step({ n, visual, title, text }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="grid w-[92px] shrink-0 place-items-center">{visual}</div>
      <div className="flex-1">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#c95ba0]">Step {n}</p>
        <p className="font-display text-[1.05rem] font-semibold leading-tight text-ink">{title}</p>
        {text && <p className="mt-0.5 text-[0.83rem] leading-snug text-ink-soft">{text}</p>}
      </div>
    </div>
  );
}

// The built-in illustrated "how to order" design (default when no admin image).
function IllustratedHowTo({ canShow = true }) {
  const [open, setOpen] = useState(false);
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    if (!canShow) return;
    try { if (!localStorage.getItem(KEY)) setOpen(true); } catch { /* ignore */ }
  }, [canShow]);

  // Pull the top active promotional offer to feature (honest & dynamic).
  useEffect(() => {
    if (!open) return;
    api.getActiveOffers().then((list) => { if (Array.isArray(list) && list.length) setOffer(list[0]); }).catch(() => {});
  }, [open]);

  const dismiss = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  if (!open) return null;

  const offerText = offer ? (offer.description || offer.name) : 'Handmade with love — a little treat with every order 💝';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm animate-[admFade_.2s_ease]"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="How to order"
    >
      <div
        className="relative max-h-[92vh] w-full max-w-[540px] overflow-y-auto rounded-[28px] p-6 pt-7 shadow-[0_30px_80px_rgba(120,50,140,.4)] animate-[admPop_.28s_ease] sm:p-7"
        style={{ background: 'linear-gradient(170deg,#fff5fa 0%,#fbeffb 55%,#f3e8ff 100%)', border: '1px solid #f4d9ec' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white text-lg leading-none text-[#c95ba0] shadow-[0_2px_8px_rgba(120,50,140,.18)] transition-transform hover:scale-105"
        >
          ✕
        </button>

        {/* Title */}
        <div className="mb-5 text-center">
          <p className="text-[1.1rem]">💕</p>
          <h2 className="font-display text-[1.6rem] font-bold leading-tight text-ink sm:text-[1.8rem]">
            How to Order
          </h2>
          <p className="mt-1 text-[0.9rem] text-ink-soft">Handmade &amp; made to order — here’s how it works 🩷</p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-1">
          <Step
            n={1}
            title="Choose your favourite"
            text="Browse our handmade designs and pick the one you love."
            visual={
              <div className="grid w-full grid-cols-2 gap-1.5">
                {CASE_TILES.map((t, i) => <CaseTile key={i} bg={t.bg} />)}
              </div>
            }
          />

          <div className="my-1 text-center text-[1.1rem] text-[#d98bc4]">↓</div>

          <Step
            n={2}
            title="Pick your phone model"
            text="For covers, select your brand &amp; exact model so it fits perfectly."
            visual={
              <div className="w-full rounded-xl border-2 border-dashed border-[#e2a9d3] bg-white px-2.5 py-2 text-center text-[0.72rem] font-bold text-[#c95ba0] shadow-sm">
                Select model ▾
              </div>
            }
          />

          <div className="my-1 text-center text-[1.1rem] text-[#d98bc4]">↓</div>

          <Step
            n={3}
            title="Add to cart & checkout"
            text="Add it to your cart, pay securely, and we’ll craft it for you."
            visual={
              <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-[0_4px_12px_rgba(120,60,150,.18)]">
                <span className="text-[1.7rem]">🛒</span>
                <span className="absolute -right-2 -top-2 rotate-6 rounded-full bg-[#e57fc4] px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow">Yay!</span>
              </div>
            }
          />
        </div>

        {/* Offer highlight */}
        <div className="mt-5 rounded-2xl bg-[linear-gradient(120deg,#ffe3f1,#f3ddfb)] px-4 py-3 text-center">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#c95ba0]">🎁 Special offer</p>
          <p className="mt-0.5 text-[0.92rem] font-semibold text-ink">{offerText}</p>
        </div>

        <button
          className="mt-5 w-full rounded-full py-3.5 text-[0.98rem] font-bold text-white shadow-[0_10px_24px_rgba(166,79,214,.35)] transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(90deg,#e57fc4,#a64fd6,#8b63ef)' }}
          onClick={dismiss}
        >
          Got it — let’s shop ✨
        </button>
      </div>
    </div>
  );
}
