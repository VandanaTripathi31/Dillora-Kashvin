'use client';
import { useState, useEffect } from 'react';
import { api } from '@/data/api';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';

const KEY = 'dilora_feedback_asked';

// Post-delivery feedback popup. Shows once (per session) to a signed-in customer
// who has a delivered order and hasn't left feedback yet — when the admin has
// enabled it. Submissions go to the admin's Feedback moderation queue.
export default function FeedbackPopup() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const fp = settings?.feedbackPopup;

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!fp?.enabled || !user?.phone) return;
    try { if (sessionStorage.getItem(KEY)) return; } catch { /* ignore */ }
    let alive = true;
    (async () => {
      const [orders, can] = await Promise.all([
        api.getOrdersByPhone(user.phone).catch(() => []),
        api.canSubmitFeedback(user.phone).catch(() => ({ ok: false })),
      ]);
      if (!alive) return;
      const delivered = Array.isArray(orders) && orders.some((o) => o.status === 'Delivered');
      if (delivered && !can?.existing) setOpen(true);
    })();
    return () => { alive = false; };
  }, [fp?.enabled, user?.phone]);

  if (!open) return null;

  const close = () => { try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ } setOpen(false); };

  const submit = async () => {
    if (!rating) return;
    setBusy(true);
    await api.submitFeedback({ name: user?.name, phone: user?.phone, rating, text }).catch(() => {});
    setBusy(false);
    setDone(true);
    try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <div
      className="fixed inset-0 z-[190] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm animate-[admFade_.2s_ease] sm:items-center"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Feedback"
    >
      <div
        className="relative w-full max-w-[400px] rounded-[24px] p-6 text-center shadow-[0_30px_80px_rgba(0,0,0,.4)] animate-[admPop_.28s_ease]"
        style={{ background: 'linear-gradient(160deg,#f4ecff,#fdeaf5,#ffeede)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-none bg-white/80 text-ink shadow-sm hover:scale-105">✕</button>
        {done ? (
          <>
            <p className="text-[2rem]">💜</p>
            <h3 className="font-display text-[1.3rem] font-bold text-ink">Thank you!</h3>
            <p className="mt-1 text-[0.9rem] text-ink-soft">Your feedback helps us make every piece better.</p>
            <button onClick={close} className="btn btn-primary btn-block mt-4">Close</button>
          </>
        ) : (
          <>
            <h3 className="font-display text-[1.35rem] font-bold leading-tight text-ink">{fp?.question || 'How was your experience?'}</h3>
            <div className="my-3 flex justify-center gap-1.5" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={`cursor-pointer border-none bg-transparent text-[2rem] leading-none transition-transform hover:scale-110 ${n <= rating ? 'text-[#f5a623]' : 'text-[#d8d2e0]'}`}>★</button>
              ))}
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Tell us more (optional)…" className="w-full resize-y rounded-[12px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 py-2.5 text-[0.9rem] focus:border-orchid-500 focus:outline-none" />
            <button onClick={submit} disabled={!rating || busy} className="btn btn-primary btn-block mt-3">{busy ? 'Sending…' : 'Submit feedback'}</button>
          </>
        )}
      </div>
    </div>
  );
}
