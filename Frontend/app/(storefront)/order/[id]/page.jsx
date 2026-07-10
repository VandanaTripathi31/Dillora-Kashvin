'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/data/api';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { Spinner } from '@/components/UI';

// Build the WhatsApp confirmation deep link for a placed order.
function buildWhatsAppLink(order, number) {
  const digits = String(number || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  const lines = [
    "Hi! I'd like to confirm my Dillora order 🌸",
    `Order ID: ${order.id}`,
    `Name: ${order.customer?.name || ''}`,
    'Items:',
    ...order.items.map(it => `• ${it.name} ×${it.qty}${it.options ? ` (${it.options})` : ''}`),
    `Total: ₹${order.total}`,
    order.paymentStatus === 'advance-paid' ? `Advance paid: ₹${order.advancePaid} · Balance on delivery: ₹${order.pendingAmount}` : '',
    `Deliver to: ${order.customer?.address || ''}`,
  ].filter(Boolean);
  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join('\n'))}`;
}

// Deterministic confetti pieces (no Math.random → hydration-safe).
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 5.5 + 3) % 98,
  bg: ['#a64fd6', '#7a4ff0', '#e57fc4', '#f5a623', '#35c281', '#8b63ef'][i % 6],
  delay: (i % 6) * 0.12,
  dur: 2 + (i % 4) * 0.35,
}));

export default function OrderConfirm() {
  const { id } = useParams();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [order, setOrder] = useState(null); // null = loading, false = not found
  const [phoneInput, setPhoneInput] = useState('');
  const [lookupErr, setLookupErr] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  // Guest lookup: re-open this order with the phone used at checkout.
  const lookup = async () => {
    const p = phoneInput.trim();
    if (!/^\d{10}$/.test(p)) { setLookupErr('Enter the 10-digit phone number used at checkout.'); return; }
    setLookingUp(true); setLookupErr('');
    try {
      const o = await api.trackOrder(id, p);
      setOrder(o);
    } catch {
      setLookupErr('No order found with that ID and phone number.');
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(() => {
    // 1) Prefer the order we just placed (stashed at checkout) — no auth needed.
    try {
      const cached = JSON.parse(sessionStorage.getItem('dilora_last_order') || 'null');
      if (cached && cached.id === id) { setOrder(cached); return; }
    } catch { /* ignore */ }
    // 2) Otherwise find it among the signed-in customer's own orders (public by-phone endpoint).
    if (user?.phone) {
      api.getOrdersByPhone(user.phone).then(list => setOrder(list.find(o => o.id === id) || false)).catch(() => setOrder(false));
    } else {
      setOrder(false);
    }
  }, [id, user]);

  // Best-effort auto-open WhatsApp confirmation, once per order. Popup blockers
  // may prevent it — the button below is always available as the reliable path.
  const waLink = order && order.id ? buildWhatsAppLink(order, settings?.whatsappNumber) : '';
  useEffect(() => {
    if (!waLink || !order?.id) return;
    const key = `wa_sent_${order.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      window.open(waLink, '_blank', 'noopener');
    } catch { /* ignore */ }
  }, [waLink, order?.id]);

  if (order === null) return <div className="container section"><Spinner /></div>;
  if (!order) return (
    <div className="container section" style={{ maxWidth: 460 }}>
      <h2>Track your order</h2>
      <p className="muted mb-4">Enter the phone number you used at checkout to view order <b>{id}</b>.</p>
      <input
        className="w-full rounded-xl border-[1.5px] border-[#eee3f3] bg-white px-3.5 py-3 text-ink transition-[border-color] focus:border-orchid-500 focus:outline-none"
        value={phoneInput}
        onChange={e => setPhoneInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') lookup(); }}
        inputMode="numeric"
        maxLength={10}
        placeholder="10-digit phone number"
        aria-label="Phone number used at checkout"
      />
      {lookupErr && <p className="mt-2 text-[0.9rem] font-semibold text-[#c4495b]">{lookupErr}</p>}
      <button className="btn btn-primary btn-block mt-3" onClick={lookup} disabled={lookingUp}>
        {lookingUp ? 'Looking up…' : 'View order'}
      </button>
      <Link href="/" className="btn btn-ghost btn-block mt-2">Back home</Link>
    </div>
  );

  const label = { online:'Paid online', 'half-cod':'Half online + COD', cod:'Cash on delivery' }[order.payment];

  // Estimated delivery window from admin settings (falls back to 3–7 days).
  const dMin = settings?.delivery?.estimatedDaysMin ?? 3;
  const dMax = settings?.delivery?.estimatedDaysMax ?? 7;
  const base = order.createdAt ? new Date(order.createdAt).getTime() : NaN;
  const fmt = (days) => new Date(base + days * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const eta = Number.isFinite(base) ? `${fmt(dMin)} – ${fmt(dMax)}` : `${dMin}–${dMax} days`;

  return (
    <div className="container section max-w-[560px] text-center">
      <div className="orderok mb-6">
        <div className="orderok__confetti" aria-hidden="true">
          {CONFETTI.map((c, i) => (
            <i key={i} style={{ left: `${c.left}%`, background: c.bg, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }} />
          ))}
        </div>
        <div className="orderok__check">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" /></svg>
        </div>
        <h1 className="mb-1.5 font-display text-[1.9rem] font-bold leading-tight text-ink">Order confirmed! 🎉</h1>
        <p className="text-ink-soft">Thanks{order.customer?.name ? `, ${order.customer.name.split(' ')[0]}` : ''} — we&apos;re on it 💜</p>
        <div className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold text-orchid-600 backdrop-blur">
          Order ID <span className="font-bold text-ink">{order.id}</span>
        </div>
        <p className="mt-3 text-[0.9rem] font-semibold text-[#2e9e6b]">🚚 Estimated delivery: {eta}</p>
      </div>

      <div className="card my-7 p-[22px] text-left">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between gap-2.5 border-b border-dashed border-[#eee3f3] py-2 text-[0.9rem]">
            <span>{it.name} <em className="muted">×{it.qty}</em><br/><small className="muted">{it.options}</small></span>
            <span>₹{(it.price*it.qty).toLocaleString('en-IN')}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t-[1.5px] border-[#eee3f3] pb-2 pt-3.5 text-[1.1rem] font-bold"><span>Total</span><span>₹{order.total.toLocaleString('en-IN')}</span></div>
        <div className="flex justify-between py-2 text-[0.95rem]"><span>Payment</span><span>{label}</span></div>
        {order.paymentStatus === 'advance-paid' && (
          <>
            <div className="flex justify-between py-2 text-[0.95rem] text-orchid-600"><span>Advance paid</span><span>₹{(order.advancePaid || 0).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between py-2 text-[0.95rem] font-semibold text-[#8a6d1a]"><span>Balance on delivery</span><span>₹{(order.pendingAmount || 0).toLocaleString('en-IN')}</span></div>
          </>
        )}
        {order.paymentStatus === 'pending' && (
          <div className="flex justify-between py-2 text-[0.95rem] font-semibold text-[#2e7d52]"><span>Pay on delivery</span><span>₹{(order.pendingAmount || order.total || 0).toLocaleString('en-IN')}</span></div>
        )}
        <div className="flex justify-between py-2 text-[0.95rem]"><span>Deliver to</span><span className="text-right">{order.customer?.address}</span></div>
      </div>

      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#25D366] px-5 py-3 font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.29-.15-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.72-1.6-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49-.17-.01-.36-.01-.55-.01-.19 0-.51.07-.77.36-.26.29-1.01.99-1.01 2.41 0 1.42 1.03 2.79 1.18 2.98.15.19 2.03 3.1 4.92 4.35.69.3 1.22.47 1.64.6.69.22 1.31.19 1.81.12.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2z"/></svg>
          Confirm order on WhatsApp
        </a>
      )}
      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
        <Link href="/account" className="btn btn-primary btn-block">Track order</Link>
        <Link href="/" className="btn btn-ghost btn-block">Continue shopping</Link>
      </div>
    </div>
  );
}
