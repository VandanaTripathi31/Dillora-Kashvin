'use client';
import { useSettings } from '@/context/SettingsContext';
import ContentPopup from './ContentPopup';

// General promotional popup the admin can run anytime, site-wide (Dashboard →
// Popups). Defers to the Welcome popup when both are on, so they never stack.
export default function PromoPopup() {
  const { settings } = useSettings();
  const p = settings?.popups?.promo;
  if (!p?.enabled || settings?.popups?.welcome?.enabled) return null;

  const hasContent = p.heading || p.description || p.couponCode || p.image;
  if (!hasContent) return null;
  return <ContentPopup data={p} storageKey="dilora_promo_seen" />;
}
