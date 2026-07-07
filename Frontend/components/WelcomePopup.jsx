'use client';
import { useSettings } from '@/context/SettingsContext';
import ImagePopup from './ImagePopup';

// Shown when a visitor opens the website. Admin-managed image (Dashboard →
// Popups). Renders nothing until the admin enables it and uploads an image.
export default function WelcomePopup() {
  const { settings } = useSettings();
  const w = settings?.popups?.welcome;
  if (!w?.enabled || !w?.image) return null;
  return <ImagePopup image={w.image} link={w.link} storageKey="dilora_welcome_seen" />;
}
