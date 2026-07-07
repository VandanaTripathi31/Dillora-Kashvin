'use client';
import Link from 'next/link';
import { Mail, Phone, MapPin, Heart } from 'lucide-react';

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

const DEFAULT_IG = 'https://www.instagram.com/dillora_by_kashvin';

export default function Footer() {
  const year = new Date().getFullYear();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const instagramUrl = settings?.instagramUrl || DEFAULT_IG;

  return (
    <footer className="relative mt-16 overflow-hidden" style={{ color: '#fff' }}>
      {/* dark gradient background — inline so it always renders */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#321447 0%,#4a1d68 45%,#2a1840 100%)' }} />
      {/* soft glow blobs */}
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl" style={{ background:'rgba(166,79,214,.25)' }} />
      <div className="absolute -bottom-24 right-0 w-72 h-72 rounded-full blur-3xl" style={{ background:'rgba(122,79,240,.22)' }} />

      <div className="relative">
        {/* Columns */}
        <div className="max-w-[1240px] mx-auto px-5 pt-14 pb-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            {/* Original Kashvin logo — shown on a light chip so the artwork reads on the dark footer */}
            <Link href="/" aria-label="Dillora by Kashvin — home" className="inline-flex rounded-2xl bg-white px-3 py-2 shadow-[0_6px_18px_rgba(0,0,0,.18)]">
              <img src="/logo.png" alt="Dillora by Kashvin" className="h-11 w-auto block" />
            </Link>
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
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" style={{ color:'#d4aeec' }} /> +91 90000 00000</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" style={{ color:'#d4aeec' }} /> Kashvin, India</li>
              <li><a href={process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001'} target="_blank" rel="noreferrer" className="text-xs transition-colors" style={{ color:'rgba(255,255,255,.4)' }}>Admin login</a></li>
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
