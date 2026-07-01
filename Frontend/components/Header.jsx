'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search as SearchIcon, Heart, User, ShoppingBag, Menu, X, Sparkles } from 'lucide-react';

import { useCategories } from '@/context/CategoriesContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Logo } from './UI';
import Search from './Search';

export default function Header() {
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { categories } = useCategories();
  const router = useRouter();

  useEffect(() => {
    // Use matchMedia (true layout viewport) instead of window.innerWidth, which
    // can be unreliable with device pixel ratio / zoom on some devices.
    const mql = window.matchMedia('(max-width: 899px)');
    const check = () => {
      setIsMobile(mql.matches);
      if (!mql.matches) setDrawer(false);
    };
    check();
    mql.addEventListener('change', check);
    return () => mql.removeEventListener('change', check);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (drawer || searchOpen) ? 'hidden' : '';
  }, [drawer, searchOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (cat) => { setDrawer(false); router.push(`/c/${cat}`); };

  return (
    <>
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="text-white text-center text-xs sm:text-sm py-2 px-3 font-semibold tracking-wide"
           style={{ background: 'linear-gradient(90deg,#8a39bd,#7a4ff0,#e57fc4,#7a4ff0,#8a39bd)', backgroundSize: '200% auto', animation: 'dlrShimmer 8s linear infinite' }}>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Handmade with love in India &middot; Free shipping on prepaid orders
        </span>
      </div>

      {/* Main bar */}
      <div className="border-b transition-all duration-300"
           style={{ background: scrolled ? 'rgba(253,251,247,.92)' : '#fdfbf7', backdropFilter: scrolled ? 'blur(10px)' : 'none', borderColor: scrolled ? 'transparent' : '#f3e9fb', boxShadow: scrolled ? '0 6px 24px rgba(122,79,240,.12)' : 'none' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[74px] flex items-center justify-between gap-4">

          {/* LEFT: burger (mobile) + logo */}
          <div className="flex items-center gap-2">
            {isMobile && (
              <button className="flex items-center justify-center w-11 h-11 rounded-xl text-ink hover:bg-orchid-50 transition-colors"
                      aria-label="Open menu" onClick={() => setDrawer(true)}>
                <Menu className="w-6 h-6" />
              </button>
            )}
            <Logo size={26} />
          </div>

          {/* CENTER: category links in a floating glass pill (desktop only) */}
          {!isMobile && (
            <nav
              className="flex items-center gap-1 px-2 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,.7)', border: '1px solid rgba(166,79,214,.18)', boxShadow: '0 4px 20px rgba(122,79,240,.10), inset 0 1px 0 rgba(255,255,255,.6)', backdropFilter: 'blur(8px)' }}
              aria-label="Categories"
            >
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => go(cat.id)}
                  className="px-3 py-2 text-[0.84rem] font-semibold rounded-full transition-all duration-200 whitespace-nowrap dlr-navpill"
                >
                  {cat.name}
                </button>
              ))}
            </nav>
          )}

          {/* RIGHT: action icons — all identical boxes, perfectly centered */}
          <div className="flex items-center gap-1">
            <button className="dlr-ic" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <SearchIcon className="w-[20px] h-[20px]" strokeWidth={2} />
            </button>
            <Link href="/wishlist" className="dlr-ic" aria-label="Wishlist">
              <Heart className="w-[20px] h-[20px]" strokeWidth={2} />
              {wishCount > 0 && <span className="dlr-badge" style={{ background:'#e57fc4' }}>{wishCount}</span>}
            </Link>
            <Link href="/account" className="dlr-ic" aria-label="Account">
              <User className="w-[20px] h-[20px]" strokeWidth={2} />
            </Link>
            <Link href="/cart" className="dlr-ic" aria-label="Cart">
              <ShoppingBag className="w-[20px] h-[20px]" strokeWidth={2} />
              {count > 0 && <span className="dlr-badge" style={{ background:'linear-gradient(135deg,#a64fd6,#7a4ff0)' }}>{count}</span>}
            </Link>
          </div>
        </div>
      </div>

      <Search open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>

    {/* Mobile slide menu — rendered OUTSIDE the sticky header so its fixed
        backdrop/drawer always cover the full viewport, even when scrolled. */}
    {isMobile && (
      <>
        {/* backdrop (always mounted; fades in/out) */}
        <div
          onClick={() => setDrawer(false)}
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(28,18,38,.55)', backdropFilter: 'blur(2px)',
            opacity: drawer ? 1 : 0,
            pointerEvents: drawer ? 'auto' : 'none',
            transition: 'opacity .25s ease',
          }}
        />
        {/* drawer panel */}
        <aside
          aria-hidden={!drawer}
          style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 1001,
            width: 'min(82vw, 330px)', background: '#fdfbf7',
            boxShadow: '0 30px 80px rgba(0,0,0,.4)',
            transform: drawer ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform .3s cubic-bezier(.22,.61,.36,1)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <div className="flex items-center justify-between px-5 h-[74px] shrink-0" style={{ background: 'linear-gradient(120deg,#a64fd6,#7a4ff0)' }}>
            <Logo size={22} light />
            <button className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/20 transition-colors" aria-label="Close menu" onClick={() => setDrawer(false)}>
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <nav className="p-3 flex flex-col gap-1 flex-1 overflow-y-auto">
            {categories.map((cat, i) => (
              <button key={cat.id} onClick={() => go(cat.id)}
                      className="flex items-center justify-between text-left px-4 py-3.5 rounded-xl text-ink font-semibold hover:text-orchid-600 transition-all duration-200"
                      style={{ background: `linear-gradient(90deg, ${['rgba(243,233,251,.7)','rgba(231,211,246,.6)'][i%2]}, transparent)` }}>
                {cat.name}<span className="text-orchid-400 text-lg">&rsaquo;</span>
              </button>
            ))}
          </nav>
          <div className="p-5 text-center text-xs text-ink-soft border-t border-orchid-100 shrink-0">
            Dillora by Kashvin &middot; Handmade with love
          </div>
        </aside>
      </>
    )}
    </>
  );
}
