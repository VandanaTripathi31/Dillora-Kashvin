'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { api } from '@/data/api';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSettings } from '@/context/SettingsContext';

export function Logo({ size = 26, light = false }) {
  // On dark / purple backgrounds (footer, mobile drawer) the brand logo PNG —
  // purple artwork + dark script — wouldn't read, so we keep a white wordmark
  // there. On the light header we show the real brand logo image.
  if (light) {
    return (
      <Link href="/" className="dilora-logo" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.02 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size, letterSpacing: '.3px', color: '#fff' }}>
            Dillora
          </span>
          <span style={{ fontSize: size * 0.38, color: 'rgba(255,255,255,.8)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
            by Kashvin
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link href="/" className="dilora-logo group" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Dillora by Kashvin — home">
      <img
        src="/logo.png"
        alt="Dillora by Kashvin"
        className="transition-transform duration-300 group-hover:scale-[1.04]"
        style={{ height: size * 2.15, width: 'auto', display: 'block' }}
      />
    </Link>
  );
}

export function Price({ price, mrp }) {
  const { showDiscounts } = useSettings();
  const showMrp = showDiscounts && mrp && mrp > price;
  return (
    <span>
      <span className="price">₹{price.toLocaleString('en-IN')}</span>
      {showMrp && <span className="strike">₹{mrp.toLocaleString('en-IN')}</span>}
    </span>
  );
}

// Real rating from customer reviews. Shows "New" until a product has reviews.
export function Rating({ id, showCount = true }) {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    let on = true;
    api.getRatingSummary(id).then(s => { if (on) setSummary(s); });
    return () => { on = false; };
  }, [id]);

  if (!summary || summary.count === 0) {
    return (
      <span className="rating rating--new" aria-label="No reviews yet">
        <span className="rating__stars">☆☆☆☆☆</span>
        <span className="rating__count">New</span>
      </span>
    );
  }

  const full = Math.round(summary.avg);
  return (
    <span className="rating" aria-label={`Rated ${summary.avg} out of 5`}>
      <span className="rating__stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      <span className="rating__count">{summary.avg}{showCount ? ` (${summary.count})` : ''}</span>
    </span>
  );
}

export function ProductCard({ product }) {
  const router = useRouter();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { showDiscounts } = useSettings();
  const off = showDiscounts && product.mrp && product.mrp > product.price
    ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  const needsOptions = product.optionType && product.optionType !== 'none';
  const wished = has(product.id);

  const quickAdd = (e) => {
    e.preventDefault();
    if (needsOptions) { router.push(`/product/${product.id}`); return; }
    add({
      productId: product.id, name: product.name, image: product.image,
      category: product.category, options: '—', refPhoto: null,
      price: product.price, qty: 1,
    });
    router.push('/cart');
  };

  const heart = (e) => { e.preventDefault(); toggle(product.id); };

  return (
    <Link href={`/product/${product.id}`} className="product-card">
      <div className="product-card__media">
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
        {off > 0 && <span className="product-card__badge">{off}% off</span>}
        <button className={`product-card__heart ${wished ? 'product-card__heart--on' : ''}`}
                onClick={heart} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7.5-4.7-10-9.3C.5 8.5 2 5 5.3 5c2 0 3.3 1.2 4.2 2.4C10.4 6.2 11.7 5 13.7 5 17 5 18.5 8.5 17 11.7 14.5 16.3 12 21 12 21z"/>
          </svg>
        </button>
        <button className="product-card__quick" onClick={quickAdd}>
          {needsOptions ? 'Choose options' : '+ Quick add'}
        </button>
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <div style={{ margin: '2px 0 6px' }}><Rating id={product.id} showCount={false} /></div>
        <Price price={product.price} mrp={product.mrp} />
      </div>
    </Link>
  );
}

export function Spinner({ label = 'Loading' }) {
  return <div className="spinner" role="status" aria-live="polite">
    <div className="spinner__dot" /><div className="spinner__dot" /><div className="spinner__dot" />
    <span className="sr-only" style={{ position:'absolute', left:-9999 }}>{label}</span>
  </div>;
}

export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast" role="status">{message}</div>;
}
