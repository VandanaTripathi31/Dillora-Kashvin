'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FestiveBanner from '@/components/FestiveBanner';
import WelcomePopup from '@/components/WelcomePopup';
import PromoPopup from '@/components/PromoPopup';
import FeedbackPopup from '@/components/FeedbackPopup';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import CountdownBar from '@/components/CountdownBar';
import OfferStrip from '@/components/OfferStrip';

export default function StorefrontLayout({ children }) {
  const pathname = usePathname();

  // scroll to top on every route change (was <ScrollTop/> in App.jsx)
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <CountdownBar />
      <FestiveBanner />
      <Header />
      <OfferStrip />
      {/* keyed by pathname so the fade/slide animation replays on navigation */}
      <div className="page">
        <div key={pathname} className="pagefade">{children}</div>
      </div>
      <Footer />
      <WelcomePopup />
      <PromoPopup />
      <FeedbackPopup />
      <FloatingWhatsApp />
    </>
  );
}
