'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useWishlist } from '@/context/WishlistContext';
import { api } from '@/data/api';
import { ProductCard, Spinner } from '@/components/UI';

export default function Wishlist() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState(null);

  useEffect(() => { api.getProducts().then(setProducts); }, []);

  if (!products) return <div className="container section"><Spinner /></div>;

  const items = products.filter(p => ids.includes(p.id));

  return (
    <div className="container section">
      <h1 className="pagetitle">Your wishlist</h1>
      {items.length === 0 ? (
        <div className="empty">
          <p className="muted">Your wishlist is empty. Tap the heart on any product to save it here.</p>
          <Link href="/" className="btn btn-primary">Browse products</Link>
        </div>
      ) : (
        <div className="grid">
          {items.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
