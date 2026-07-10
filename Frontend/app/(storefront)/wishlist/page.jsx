'use client';
import Link from 'next/link';

import { useWishlist } from '@/context/WishlistContext';
import { api } from '@/data/api';
import { useAsync } from '@/lib/useAsync';
import { ProductCard, Loader, ProductGridSkeleton } from '@/components/UI';

export default function Wishlist() {
  const { ids } = useWishlist();
  const { data: products, error, loading, retry } = useAsync(() => api.getProducts(), []);

  const items = (products || []).filter((p) => ids.includes(p.id));

  return (
    <div className="container section">
      <h1 className="pagetitle">Your wishlist</h1>
      <Loader loading={loading} error={error} onRetry={retry} fallback={<ProductGridSkeleton count={4} />}>
        {items.length === 0 ? (
          <div className="empty">
            <p className="muted">Your wishlist is empty. Tap the heart on any product to save it here.</p>
            <Link href="/" className="btn btn-primary">Browse products</Link>
          </div>
        ) : (
          <div className="grid">
            {items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </Loader>
    </div>
  );
}
