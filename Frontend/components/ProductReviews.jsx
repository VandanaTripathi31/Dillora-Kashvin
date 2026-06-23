'use client';
import { useState, useEffect } from 'react';
import { api } from '@/data/api';
import { useAuth } from '@/context/AuthContext';

function Stars({ value }) {
  const full = Math.round(value);
  return <span className="rev__stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>;
}

function StarPicker({ value, onChange }) {
  return (
    <div className="rev__picker" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`rev__pick ${n <= value ? 'rev__pick--on' : ''}`}
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

  const load = () => {
    api.getReviews(productId).then(setReviews);
    api.canReview(productId, user?.phone).then(setEligible);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [productId, user?.phone]);

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
    <section className="rev">
      <h2 className="rev__title">Reviews {reviews.length > 0 && <span className="rev__avg"><Stars value={avg} /> {Math.round(avg * 10) / 10} ({reviews.length})</span>}</h2>

      {/* Write a review — only for customers who received this item */}
      <div className="rev__write card">
        {eligible.ok ? (
          <>
            <h3>Write a review</h3>
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              className="rev__text"
              placeholder="Tell others what you loved about it…"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
            />
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy ? 'Posting…' : 'Post review'}
            </button>
            {msg && <p className="rev__msg">{msg}</p>}
          </>
        ) : (
          <p className="rev__locked muted">
            {eligible.reason === 'login' && 'Sign in and receive this item to leave a review.'}
            {eligible.reason === 'not-delivered' && 'Only customers who have received this product can review it.'}
            {eligible.reason === 'already' && (msg || 'You have already reviewed this product. Thank you!')}
          </p>
        )}
      </div>

      {/* Existing reviews */}
      {reviews.length === 0 ? (
        <p className="muted rev__empty">No reviews yet — be the first once you receive your order.</p>
      ) : (
        <ul className="rev__list">
          {reviews.map(r => (
            <li key={r.id} className="rev__item">
              <div className="rev__head">
                <span className="rev__name">{r.name}</span>
                <Stars value={r.rating} />
              </div>
              {r.text && <p className="rev__body">{r.text}</p>}
              <span className="rev__date">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
