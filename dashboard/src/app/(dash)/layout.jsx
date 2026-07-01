'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, FolderTree, ShoppingBag,
  Clapperboard, Tag, Settings, Store, LogOut, Menu, X,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/UI';

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000';

const NAV = [
  { href: '/',           label: 'Overview',   icon: LayoutDashboard, exact: true },
  { href: '/products',   label: 'Products',   icon: Package },
  { href: '/categories', label: 'Categories', icon: FolderTree },
  { href: '/orders',     label: 'Orders',     icon: ShoppingBag },
  { href: '/reels',      label: 'Reels',      icon: Clapperboard },
  { href: '/offers',     label: 'Offers',     icon: Tag },
  { href: '/settings',   label: 'Settings',   icon: Settings },
];

export default function DashLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, isAuthed, admin, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // close the mobile drawer on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  // route guard — send unauthenticated visitors to the login page
  useEffect(() => {
    if (ready && !isAuthed) router.replace('/login');
  }, [ready, isAuthed, router]);

  if (!ready || !isAuthed) {
    return <div className="adm__pad" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><Spinner /></div>;
  }

  const current = NAV.find(n => n.exact ? pathname === n.href : pathname.startsWith(n.href));

  const doLogout = () => { logout(); router.replace('/login'); };

  return (
    <div className="adm">
      {/* Mobile top bar */}
      <div className="adm__topbar">
        <button className="adm__burger" aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></button>
        <span className="adm__topbartitle">{current?.label || 'Admin'}</span>
        <a className="adm__topstore" href={STORE_URL} target="_blank" rel="noreferrer" aria-label="View store"><Store /></a>
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
          {admin && <div className="muted" style={{ fontSize: 12, padding: '0 4px 8px' }}>Signed in as <strong>{admin.email}</strong></div>}
          <a className="btn btn-ghost btn-block adm__viewstore" href={STORE_URL} target="_blank" rel="noreferrer">
            <Store className="w-[18px] h-[18px]" /> View store
          </a>
          <button className="adm__reset" onClick={doLogout}>
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      <main className="adm__main">{children}</main>
    </div>
  );
}
