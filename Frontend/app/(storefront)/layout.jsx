'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FestiveBanner from '@/components/FestiveBanner';

export default function StorefrontLayout({ children }) {
  const pathname = usePathname();

  // scroll to top on every route change (was <ScrollTop/> in App.jsx)
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <FestiveBanner />
      <Header />
      {/* keyed by pathname so the fade/slide animation replays on navigation */}
      <div className="page">
        <div key={pathname} className="pagefade">{children}</div>
      </div>
      <Footer />
    </>
  );
}
