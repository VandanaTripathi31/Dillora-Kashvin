'use client';
import Link from 'next/link';
import { Camera, Mail, Phone, MapPin, Heart, Send } from 'lucide-react';

import { CATEGORIES } from '@/data/catalog';
import { Logo } from './UI';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-16 overflow-hidden" style={{ color: '#fff' }}>
      {/* dark gradient background — inline so it always renders */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#321447 0%,#4a1d68 45%,#2a1840 100%)' }} />
      {/* soft glow blobs */}
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl" style={{ background:'rgba(166,79,214,.25)' }} />
      <div className="absolute -bottom-24 right-0 w-72 h-72 rounded-full blur-3xl" style={{ background:'rgba(122,79,240,.22)' }} />

      <div className="relative">
        {/* Newsletter */}
        <div className="max-w-[1240px] mx-auto px-5 pt-14 pb-10">
          <div className="rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-5 justify-between"
               style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)', backdropFilter:'blur(6px)' }}>
            <div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold flex items-center gap-2" style={{ color:'#fff' }}>
                Join the Dillora circle <Heart className="w-5 h-5" style={{ color:'#e7d3f6', fill:'#d4aeec' }} />
              </h3>
              <p className="text-sm mt-1" style={{ color:'rgba(255,255,255,.72)' }}>
                First dibs on new drops, festive offers and behind-the-scenes making.
              </p>
            </div>
            <form className="flex w-full md:w-auto gap-2" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Your email"
                     className="flex-1 md:w-64 px-4 py-3 rounded-full text-sm outline-none"
                     style={{ background:'rgba(255,255,255,.95)', color:'#2c2336' }} />
              <button type="submit"
                      className="shrink-0 inline-flex items-center gap-1.5 px-5 py-3 rounded-full text-sm font-semibold hover:scale-[1.03] active:scale-95 transition-transform duration-200"
                      style={{ background:'linear-gradient(90deg,#bd80e0,#8b63ef)', color:'#fff' }}>
                Subscribe <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Columns */}
        <div className="max-w-[1240px] mx-auto px-5 pb-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo light size={24} />
            <p className="text-sm leading-relaxed mt-3 max-w-xs" style={{ color:'rgba(255,255,255,.65)' }}>
              Handmade phone covers, charms, crochet, resin art and oversize tees — made to order, with care, in India.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <a href="#" aria-label="Instagram" className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:scale-110 transition-transform duration-200" style={{ background:'rgba(255,255,255,.1)' }}>
                <Camera className="w-[18px] h-[18px] block" />
              </a>
              <a href="mailto:support@kashvin.in" aria-label="Email" className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:scale-110 transition-transform duration-200" style={{ background:'rgba(255,255,255,.1)' }}>
                <Mail className="w-[18px] h-[18px] block" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'#d4aeec' }}>Shop</h4>
            <ul className="space-y-2 list-none p-0 m-0">
              {CATEGORIES.map(c => (
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
              <li><Link href="/admin" className="text-xs transition-colors" style={{ color:'rgba(255,255,255,.4)' }}>Admin login</Link></li>
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
