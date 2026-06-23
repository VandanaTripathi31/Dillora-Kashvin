'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { CATEGORIES } from '@/data/catalog';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Logo } from './UI';
import Search from './Search';

export default function Header() {
  const [drawer, setDrawer] = useState(false); // mobile menu
  const [searchOpen, setSearchOpen] = useState(false);
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const router = useRouter();

  useEffect(() => { document.body.style.overflow = (drawer || searchOpen) ? 'hidden' : ''; }, [drawer, searchOpen]);

  const go = (cat) => {
    setDrawer(false);
    router.push(`/c/${cat}`);
  };

  return (
    <header className="hdr">
      <div className="hdr__bar container">
        <button className="hdr__burger" aria-label="Open menu" onClick={() => setDrawer(true)}>
          <span /><span /><span />
        </button>

        <Logo />

        <nav className="hdr__nav" aria-label="Categories">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="hdr__navitem">
              <button className="hdr__navbtn" onClick={() => go(cat.id)}>
                {cat.name}
              </button>
            </div>
          ))}
        </nav>

        <div className="hdr__actions" style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'4px' }}>
          <button className="hdr__searchbtn" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9"/>
              <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
            </svg>
          </button>
          <Link href="/wishlist" className="hdr__searchbtn" aria-label="Wishlist" style={{ position:'relative' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M12 21s-7.5-4.7-10-9.3C.5 8.5 2 5 5.3 5c2 0 3.3 1.2 4.2 2.4C10.4 6.2 11.7 5 13.7 5 17 5 18.5 8.5 17 11.7 14.5 16.3 12 21 12 21z"/>
            </svg>
            {wishCount > 0 && <span className="hdr__cartcount">{wishCount}</span>}
          </Link>
          <Link href="/account" className="hdr__searchbtn" aria-label="Account">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </Link>
          <Link href="/cart" className="hdr__cart" aria-label="Cart">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6h15l-1.5 9h-12L6 6zM6 6L5 2H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="20" r="1.4" fill="currentColor"/><circle cx="18" cy="20" r="1.4" fill="currentColor"/>
            </svg>
            {count > 0 && <span className="hdr__cartcount">{count}</span>}
          </Link>
        </div>
      </div>

      {/* Mobile drawer — single tap goes straight to the category */}
      {drawer && <div className="drawer__backdrop" onClick={() => setDrawer(false)} />}
      <aside className={`drawer ${drawer ? 'drawer--open' : ''}`} aria-hidden={!drawer}>
        <div className="drawer__head">
          <Logo size={22} />
          <button className="drawer__close" aria-label="Close menu" onClick={() => setDrawer(false)}>✕</button>
        </div>
        <nav className="drawer__nav">
          {CATEGORIES.map(cat => (
            <button key={cat.id} className="drawer__cat" onClick={() => go(cat.id)}>
              {cat.name}
            </button>
          ))}
        </nav>
      </aside>

      <Search open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
