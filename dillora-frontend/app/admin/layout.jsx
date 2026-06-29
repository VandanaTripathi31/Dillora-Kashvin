'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, FolderTree, ShoppingBag,
  Clapperboard, Tag, Store, RotateCcw, Menu, X,
} from 'lucide-react';

import { api } from '@/data/api';
import AdminToaster from '@/components/AdminToaster';
import ConfirmRoot, { confirmDialog } from '@/components/ConfirmRoot';

const NAV = [
  { href: '/admin',            label: 'Overview',   icon: LayoutDashboard, exact: true },
  { href: '/admin/products',   label: 'Products',   icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders',     label: 'Orders',     icon: ShoppingBag },
  { href: '/admin/videos',     label: 'Reels',      icon: Clapperboard },
  { href: '/admin/coupons',    label: 'Offers',     icon: Tag },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // close the mobile drawer on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  const reset = async () => {
    const ok = await confirmDialog({
      title: 'Reset demo data?',
      message: 'This restores the default catalog and clears products and orders you added on this device.',
      confirmLabel: 'Reset data',
    });
    if (ok) { await api.resetDemo(); location.reload(); }
  };

  const current = NAV.find(n => n.exact ? pathname === n.href : pathname.startsWith(n.href));

  return (
    <div className="adm">
      {/* Mobile top bar */}
      <div className="adm__topbar">
        <button className="adm__burger" aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></button>
        <span className="adm__topbartitle">{current?.label || 'Admin'}</span>
        <button className="adm__topstore" onClick={() => router.push('/')} aria-label="View store"><Store /></button>
      </div>

      {open && <div className="adm__scrim" onClick={() => setOpen(false)} />}

      <aside className={`adm__side ${open ? 'adm__side--open' : ''}`}>
        <div className="adm__brand">
          <span className="adm__brandmark">D</span>
          <span className="adm__brandtext">
            <strong>Dillora</strong>
            <span>Admin panel</span>
          </span>
          <button className="adm__sideclose" aria-label="Close menu" onClick={() => setOpen(false)}><X /></button>
        </div>

        <nav className="adm__nav">
          {NAV.map(n => {
            const Icon = n.icon;
            const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`adm__navlink ${active ? 'adm__navlink--on' : ''}`}>
                <Icon className="adm__navicon" strokeWidth={2} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="adm__sidefoot">
          <button className="btn btn-ghost btn-block adm__viewstore" onClick={() => router.push('/')}>
            <Store className="w-[18px] h-[18px]" /> View store
          </button>
          <button className="adm__reset" onClick={reset}>
            <RotateCcw className="w-4 h-4" /> Reset demo data
          </button>
        </div>
      </aside>

      <main className="adm__main">{children}</main>
      <AdminToaster />
      <ConfirmRoot />
    </div>
  );
}
