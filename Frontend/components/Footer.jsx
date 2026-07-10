'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Mail, Phone, MapPin, Heart } from 'lucide-react';
import { api } from '@/data/api';

// Inline Instagram glyph (this lucide-react version doesn't export `Instagram`).
function InstagramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

import { useCategories } from '@/context/CategoriesContext';
import { useSettings } from '@/context/SettingsContext';
import { LogoMark } from '@/components/UI';

const DEFAULT_IG = 'https://www.instagram.com/dillora_by_kashvin';
const DEFAULT_WA = '918369830139'; // 91 + 8369830139 (support / WhatsApp)

// "918369830139" -> "+91 83698 30139" for display.
function prettyPhone(digits) {
  const d = String(digits || '').replace(/\D/g, '');
  const local = d.length > 10 ? d.slice(-10) : d;
  const cc = d.length > 10 ? d.slice(0, d.length - 10) : '91';
  if (local.length !== 10) return '+' + d;
  return `+${cc} ${local.slice(0, 5)} ${local.slice(5)}`;
}

// Email capture — builds an owned audience for launch/marketing emails.
function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // '' | 'ok' | 'err'
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setStatus('err'); return; }
    setBusy(true); setStatus('');
    try { await api.subscribe(email.trim(), 'footer'); setStatus('ok'); setEmail(''); }
    catch { setStatus('err'); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-5 pt-12">
      <div className="rounded-3xl border border-white/10 bg-white/[.06] px-6 py-6 backdrop-blur sm:px-8 sm:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-white">Join the Dillora circle 💜</h3>
            <p className="text-sm text-white/70">New handmade drops, offers &amp; restocks — straight to your inbox.</p>
          </div>
          <form onSubmit={submit} className="flex w-full gap-2 sm:w-auto">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com" aria-label="Email address"
              className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/95 px-4 py-2.5 text-ink placeholder:text-ink-soft/70 focus:outline-none sm:w-64"
            />
            <button type="submit" disabled={busy} className="btn btn-primary shrink-0 whitespace-nowrap">
              {busy ? '…' : 'Subscribe'}
            </button>
          </form>
        </div>
        {status === 'ok' && <p className="mt-3 text-sm font-semibold text-[#9be7c4]">Thanks! You&apos;re on the list. 🎉</p>}
        {status === 'err' && <p className="mt-3 text-sm font-semibold text-[#ffb3c1]">Please enter a valid email address.</p>}
      </div>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const instagramUrl = settings?.instagramUrl || DEFAULT_IG;
  const waNumber = (settings?.whatsappNumber || '').replace(/\D/g, '') || DEFAULT_WA;
  const phoneDisplay = prettyPhone(waNumber);

  return (
    <footer className="relative mt-16 overflow-hidden" style={{ color: '#fff' }}>
      {/* dark gradient background — inline so it always renders */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#321447 0%,#4a1d68 45%,#2a1840 100%)' }} />
      {/* soft glow blobs */}
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl" style={{ background:'rgba(166,79,214,.25)' }} />
      <div className="absolute -bottom-24 right-0 w-72 h-72 rounded-full blur-3xl" style={{ background:'rgba(122,79,240,.22)' }} />

      <div className="relative">
        <NewsletterSignup />
        {/* Columns */}
        <div className="max-w-[1240px] mx-auto px-5 pt-12 pb-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            {/* Brand logo — shown on a light chip so the colourful wordmark reads on the dark footer */}
            <Link href="/" aria-label="Dillora by Kashvin — home" className="inline-flex rounded-2xl bg-white px-4 py-2.5 shadow-[0_6px_18px_rgba(0,0,0,.18)]">
              <LogoMark size={34} />
            </Link>
            <p className="font-display text-lg font-bold mt-3 text-white">Dillora by Kashvin</p>
            <p className="text-sm leading-relaxed mt-3 max-w-xs" style={{ color:'rgba(255,255,255,.65)' }}>
              Handmade phone covers, charms, crochet, resin art and oversize tees — made to order, with care, in India.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Follow us on Instagram" className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:scale-110 transition-transform duration-200" style={{ background:'rgba(255,255,255,.1)' }}>
                <InstagramIcon className="w-[18px] h-[18px] block" />
              </a>
              <a href="mailto:support@kashvin.in" aria-label="Email" className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:scale-110 transition-transform duration-200" style={{ background:'rgba(255,255,255,.1)' }}>
                <Mail className="w-[18px] h-[18px] block" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'#d4aeec' }}>Shop</h4>
            <ul className="space-y-2 list-none p-0 m-0">
              {categories.map(c => (
                <li key={c.id}>
                  <Link href={`/c/${c.id}`} className="text-sm hover:pl-1 transition-all duration-200 inline-block" style={{ color:'rgba(255,255,255,.75)' }}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'#d4aeec' }}>Help</h4>
            <ul className="space-y-2 list-none p-0 m-0">
              {[['About us','/about'],['Shipping','/page/shipping'],['Returns & Refund','/page/returns'],['Privacy Policy','/page/privacy'],['Terms of Service','/page/terms']].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm hover:pl-1 transition-all duration-200 inline-block" style={{ color:'rgba(255,255,255,.75)' }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'#d4aeec' }}>Contact</h4>
            <ul className="space-y-2.5 text-sm list-none p-0 m-0" style={{ color:'rgba(255,255,255,.75)' }}>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" style={{ color:'#d4aeec' }} /> support@kashvin.in</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" style={{ color:'#d4aeec' }} /><a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="hover:underline">{phoneDisplay}</a></li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" style={{ color:'#d4aeec' }} /> Kashvin, India</li>
              {process.env.NEXT_PUBLIC_DASHBOARD_URL && (
                <li><a href={process.env.NEXT_PUBLIC_DASHBOARD_URL} target="_blank" rel="noreferrer" className="text-xs transition-colors" style={{ color:'rgba(255,255,255,.4)' }}>Admin login</a></li>
              )}
            </ul>
          </div>
        </div>

        {/* Base bar */}
        <div className="relative" style={{ borderTop:'1px solid rgba(255,255,255,.1)' }}>
          <div className="max-w-[1240px] mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs" style={{ color:'rgba(255,255,255,.6)' }}>
            <span>© {year} Dillora by Kashvin. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              Made to order <Heart className="w-3 h-3" style={{ color:'#d4aeec', fill:'#d4aeec' }} /> Free shipping over ₹299
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
