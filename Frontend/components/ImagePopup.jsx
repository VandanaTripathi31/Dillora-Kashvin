'use client';
import { useState, useEffect } from 'react';

/**
 * A simple image-based popup the admin fully controls (upload any image).
 * Shows once per image: the "seen" flag stores the image URL, so whenever the
 * admin swaps the image, every visitor sees the new one once.
 *
 * @param {string} image - image URL (nothing renders if empty)
 * @param {string} [link] - optional click-through URL
 * @param {string} storageKey - localStorage key for the per-image "seen" flag
 * @param {boolean} [canShow=true] - external gate (e.g. don't stack popups)
 */
export default function ImagePopup({ image, link, storageKey, canShow = true }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!image || !canShow) return;
    try { if (localStorage.getItem(storageKey) !== image) setOpen(true); } catch { /* ignore */ }
  }, [image, storageKey, canShow]);

  const dismiss = () => {
    try { localStorage.setItem(storageKey, image); } catch { /* ignore */ }
    setOpen(false);
  };

  if (!open || !image) return null;

  const img = (
    <img src={image} alt="" className="block h-auto max-h-[86vh] w-auto max-w-full rounded-2xl" />
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-[admFade_.2s_ease]"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Popup"
    >
      <div className="relative animate-[admPop_.28s_ease]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute -right-3 -top-3 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white text-lg leading-none text-ink shadow-[0_2px_10px_rgba(0,0,0,.25)] transition-transform hover:scale-105"
        >
          ✕
        </button>
        {link
          ? <a href={link} target="_blank" rel="noreferrer" onClick={dismiss} className="block">{img}</a>
          : img}
      </div>
    </div>
  );
}
