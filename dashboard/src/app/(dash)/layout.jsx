'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, FolderTree, ShoppingBag,
  Clapperboard, Tag, Settings, Store, LogOut, Menu, X, MessageSquare, Smartphone, FileText, Gift, Star, Image as ImageIcon, Sparkles, ScrollText, Palette, Link2,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/UI';

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000';

const NAV = [
  { href: '/',           label: 'Overview',   icon: LayoutDashboard, exact: true },
  { href: '/products',   label: 'Products',   icon: Package },
  { href: '/variants',   label: 'Variants',   icon: Palette },
  { href: '/pairings',   label: 'Pair It With', icon: Link2 },
  { href: '/categories', label: 'Categories', icon: FolderTree },
  { href: '/brands',     label: 'Phone Brands & Models', icon: Smartphone },
  { href: '/orders',     label: 'Orders',     icon: ShoppingBag },
  { href: '/invoices',   label: 'Invoices',   icon: FileText },
  { href: '/reels',      label: 'Reels',      icon: Clapperboard },
  { href: '/banners',    label: 'Banners',    icon: ImageIcon },
  { href: '/popups',     label: 'Popups',     icon: Sparkles },
  { href: '/offers',     label: 'Coupons',    icon: Tag },
  { href: '/promotions', label: 'Promotions', icon: Gift },
  { href: '/reviews',    label: 'Reviews',    icon: Star },
  { href: '/policies',   label: 'Policies',   icon: ScrollText },
  { href: '/feedback',   label: 'Feedback',   icon: MessageSquare },
  { href: '/settings',   label: 'Settings',   icon: Settings },
];

export default function DashLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, isAuthed, admin, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // close the mobile drawer on navigation — adjust state during render (the
  // React-recommended alternative to calling setState inside an effect)
  const [navPath, setNavPath] = useState(pathname);
  if (pathname !== navPath) {
    setNavPath(pathname);
    setOpen(false);
  }

  // route guard — send unauthenticated visitors to the login page
  useEffect(() => {
    if (ready && !isAuthed) router.replace('/login');
  }, [ready, isAuthed, router]);

  if (!ready || !isAuthed) {
    return <div className="adm__pad" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><Spinner /></div>;
  }

  const current = NAV.find(n => n.exact ? pathname === n.href : pathname.startsWith(n.href));

  const doLogout = () => { logout(); router.replace('/login'); };

  const navLink = 'flex items-center gap-2.5 rounded-xl px-3 py-[10px] text-[0.86rem] font-semibold leading-tight transition-[background,color,transform] duration-200';
  const navOff = 'text-white/70 hover:translate-x-0.5 hover:bg-white/[.08] hover:text-white';
  const navOn = 'bg-[linear-gradient(135deg,rgba(166,79,214,.95),rgba(122,79,240,.95))] text-white shadow-[0_8px_20px_-6px_rgba(122,79,240,.6)]';

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f5f2fb] min-[901px]:grid-cols-[256px_1fr]">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-[60] flex items-center justify-between gap-3 border-b border-[#eee3f3] bg-white px-3.5 py-[11px] min-[901px]:hidden">
        <button className="grid h-10 w-10 cursor-pointer place-items-center rounded-[10px] border-none bg-transparent text-ink hover:bg-[#f9f2fd]" aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></button>
        <span className="font-display text-[1.1rem] font-semibold">{current?.label || 'Admin'}</span>
        <a className="grid h-10 w-10 cursor-pointer place-items-center rounded-[10px] border-none bg-transparent text-ink hover:bg-[#f9f2fd]" href={STORE_URL} target="_blank" rel="noreferrer" aria-label="View store"><Store /></a>
      </div>

      {open && <div className="fixed inset-0 z-[110] animate-[admFade_0.2s_ease] bg-[rgba(20,12,30,.5)] min-[901px]:hidden" onClick={() => setOpen(false)} />}

      <aside className={`sticky top-0 flex h-screen flex-col gap-1.5 border-r border-white/[.06] bg-[linear-gradient(185deg,#3a2456_0%,#2c2336_58%,#221830_100%)] px-3.5 py-5 text-white max-[900px]:fixed max-[900px]:inset-y-0 max-[900px]:left-0 max-[900px]:z-[120] max-[900px]:w-[min(82vw,280px)] max-[900px]:border-r-0 max-[900px]:transition-transform max-[900px]:duration-[280ms] ${open ? 'max-[900px]:translate-x-0 max-[900px]:shadow-[0_30px_80px_rgba(0,0,0,.45)]' : 'max-[900px]:-translate-x-full'}`}>
        <div className="flex items-center gap-[11px] px-2 pb-5 pt-1.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#a64fd6,#7a4ff0)] font-display text-2xl font-bold leading-none text-white shadow-[0_6px_18px_rgba(122,79,240,.45)]">D</span>
          <span className="flex flex-col leading-[1.15]">
            <strong className="font-display text-[1.2rem] font-bold text-white">Dillora</strong>
            <span className="font-body text-[0.68rem] uppercase tracking-[0.12em] text-white/50">Admin panel</span>
          </span>
          <button className="ml-auto hidden cursor-pointer border-none bg-transparent text-white/70 max-[900px]:block" aria-label="Close menu" onClick={() => setOpen(false)}><X /></button>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(n => {
            const Icon = n.icon;
            const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`${navLink} ${active ? navOn : navOff}`}>
                <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'opacity-100' : 'opacity-85'}`} strokeWidth={2} />
                <span className="flex-1">{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-white/[.08] pt-3.5">
          {admin && <div className="muted px-1 pb-2 text-[12px]">Signed in as <strong>{admin.email}</strong></div>}
          <a className="btn btn-block flex justify-center gap-2 !border !border-white/[.14] !bg-white/[.08] !text-white" href={STORE_URL} target="_blank" rel="noreferrer">
            <Store className="h-[18px] w-[18px]" /> View store
          </a>
          <button className="flex cursor-pointer items-center justify-center gap-2 border-none bg-transparent p-1.5 text-[0.8rem] text-white/45 hover:text-white/80" onClick={doLogout}>
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      <main className="overflow-x-auto bg-[#f5f2fb]">{children}</main>
    </div>
  );
}
