'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import { api } from '@/data/api';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // active-state helper: exact match for overview, prefix match for others
  const link = (href, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return `adm__navlink ${active ? 'adm__navlink--on' : ''}`;
  };

  const reset = async () => {
    if (confirm('Reset demo data back to defaults? This clears added products and orders.')) {
      await api.resetDemo(); location.reload();
    }
  };

  return (
    <div className="adm">
      <aside className="adm__side">
        <div className="adm__brand">
          Dillora
          <span>Admin</span>
        </div>
        <nav className="adm__nav">
          <Link href="/admin" className={link('/admin', true)}>Overview</Link>
          <Link href="/admin/products" className={link('/admin/products')}>Products</Link>
          <Link href="/admin/categories" className={link('/admin/categories')}>Categories</Link>
          <Link href="/admin/orders" className={link('/admin/orders')}>Orders</Link>
          <Link href="/admin/videos" className={link('/admin/videos')}>Reels</Link>
          <Link href="/admin/coupons" className={link('/admin/coupons')}>Offers</Link>
        </nav>
        <div className="adm__sidefoot">
          <button className="btn btn-ghost btn-block" onClick={() => router.push('/')}>View store</button>
          <button className="adm__reset" onClick={reset}>Reset demo data</button>
        </div>
      </aside>
      <main className="adm__main">
        {children}
      </main>
    </div>
  );
}
