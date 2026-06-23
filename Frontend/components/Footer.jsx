'use client';
import Link from 'next/link';

import { CATEGORIES } from '@/data/catalog';
import { Logo } from './UI';

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="container ftr__grid">
        <div>
          <Logo light size={24} />
          <p className="ftr__about">
            Handmade phone covers, charms, crochet, resin art and oversize tees —
            made to order, with care, in India.
          </p>
        </div>
        <div>
          <h4 className="ftr__h">Shop</h4>
          {CATEGORIES.map(c => <Link key={c.id} href={`/c/${c.id}`} className="ftr__link">{c.name}</Link>)}
        </div>
        <div>
          <h4 className="ftr__h">Help</h4>
          <Link href="/page/shipping" className="ftr__link">Shipping</Link>
          <Link href="/page/returns" className="ftr__link">Returns &amp; Refund</Link>
          <Link href="/page/privacy" className="ftr__link">Privacy Policy</Link>
          <Link href="/page/terms" className="ftr__link">Terms of Service</Link>
        </div>
        <div>
          <h4 className="ftr__h">Contact</h4>
          <p className="ftr__link">support@kashvin.in</p>
          <p className="ftr__link">+91 90000 00000</p>
          <p className="ftr__link">Kashvin, India</p>
          <Link href="/admin" className="ftr__link" style={{ opacity:.6 }}>Admin login</Link>
        </div>
      </div>
      <div className="ftr__base container">
        <span>© {new Date().getFullYear()} Dillora by Kashvin</span>
        <span>Made to order · Free shipping over ₹299</span>
      </div>
    </footer>
  );
}
