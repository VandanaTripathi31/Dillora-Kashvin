'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/data/api';
import { useAuth } from '@/context/AuthContext';

function Stars({ value }) {
  const full = Math.round(value);
  return <span className="tracking-[1px] text-[#f5a623]">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>;
}

function StarPicker({ value, onChange }) {
  return (
    <div className="mb-3 flex gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`cursor-pointer border-none bg-transparent p-0 text-[1.8rem] leading-none transition-[color,transform] duration-[120ms] hover:scale-[1.12] ${n <= value ? 'text-[#f5a623]' : 'text-[#d8d2e0]'}`}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
        >★</button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(null);
  const [eligible, setEligible] = useState({ ok: false, reason: 'login' });
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    api.getReviews(productId).then(setReviews);
    api.canReview(productId, user?.phone).then(setEligible);
  }, [productId, user?.phone]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!rating) { setMsg('Please pick a star rating.'); return; }
    setBusy(true); setMsg('');
    const res = await api.addReview(productId, {
      name: user?.name, phone: user?.phone, rating, text,
    });
    setBusy(false);
    if (!res.ok) {
      setMsg(res.reason === 'already' ? 'You have already reviewed this product.' : 'Could not submit review.');
      return;
    }
    setRating(0); setText(''); setMsg('Thanks! Your review is posted.');
    load();
  };

  if (reviews === null) return null;

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  return (
    <section className="mb-2 mt-12">
      <h2 className="mb-[18px] flex flex-wrap items-center gap-3.5 text-[1.5rem]">Reviews {reviews.length > 0 && <span className="inline-flex items-center gap-1.5 text-[0.95rem] font-medium text-ink-soft"><Stars value={avg} /> {Math.round(avg * 10) / 10} ({reviews.length})</span>}</h2>

      {/* Write a review — only for customers who received this item */}
      <div className="card mb-6 px-[22px] py-5">
        {eligible.ok ? (
          <>
            <h3 className="mb-2.5 text-[1.1rem]">Write a review</h3>
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              className="mb-3 w-full resize-y rounded-[14px] border border-[#eee3f3] px-3.5 py-3 font-body text-[0.95rem] focus:border-orchid-500 focus:outline-none"
              placeholder="Tell others what you loved about it…"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
            />
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy ? 'Posting…' : 'Post review'}
            </button>
            {msg && <p className="mt-2.5 text-[0.9rem] text-orchid-600">{msg}</p>}
          </>
        ) : (
          <p className="muted m-0 py-1">
            {eligible.reason === 'login' && 'Sign in and receive this item to leave a review.'}
            {eligible.reason === 'not-delivered' && 'Only customers who have received this product can review it.'}
            {eligible.reason === 'already' && (msg || 'You have already reviewed this product. Thank you!')}
          </p>
        )}
      </div>

      {/* Existing reviews */}
      {reviews.length === 0 ? (
        <p className="muted pt-2">No reviews yet — be the first once you receive your order.</p>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0">
          {reviews.map(r => (
            <li key={r.id} className="rounded-2xl border border-[#eee3f3] bg-white px-[18px] py-4">
              <div className="mb-1.5 flex items-center justify-between gap-2.5">
                <span className="font-semibold">{r.name}</span>
                <Stars value={r.rating} />
              </div>
              {r.text && <p className="mb-2 mt-1 leading-[1.6] text-ink-soft">{r.text}</p>}
              <span className="text-[0.78rem] text-ink-soft opacity-80">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
