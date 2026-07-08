'use client';
import { useSettings } from '@/context/SettingsContext';
import ImagePopup from './ImagePopup';
import ContentPopup from './ContentPopup';

// Shown once when a visitor opens the website (Dashboard → Popups). Renders a
// rich content popup when the admin fills in text/coupon, otherwise a plain
// image popup, otherwise nothing.
export default function WelcomePopup() {
  const { settings } = useSettings();
  const w = settings?.popups?.welcome;
  if (!w?.enabled) return null;

  const hasContent = w.heading || w.description || w.couponCode || w.buttonText;
  if (hasContent) return <ContentPopup data={w} storageKey="dilora_welcome_seen" />;
  if (w.image) return <ImagePopup image={w.image} link={w.link} storageKey="dilora_welcome_seen" />;
  return null;
}
