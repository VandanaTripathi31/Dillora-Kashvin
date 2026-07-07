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

const inputCls = 'mb-3 w-full rounded-[14px] border border-[#eee3f3] px-3.5 py-3 font-body text-[0.95rem] focus:border-orchid-500 focus:outline-none';

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(null);
  const [eligible, setEligible] = useState({ ok: false, reason: 'login' });
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const [images, setImages] = useState([]); // uploaded URLs
  const [video, setVideo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    api.getReviews(productId).then(setReviews);
    api.canReview(productId, user?.phone).then(setEligible);
  }, [productId, user?.phone]);
  useEffect(() => { load(); }, [load]);

  const onImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true); setMsg('');
    try {
      for (const f of files) {
        if (images.length >= 5) break;
        const { url } = await api.uploadReviewMedia(productId, user?.phone, f, 'image');
        setImages(prev => (prev.length < 5 ? [...prev, url] : prev));
      }
    } catch (err) { setMsg(err.message || 'Image upload failed.'); }
    setUploading(false);
  };

  const onVideo = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setUploading(true); setMsg('');
    try {
      const { url } = await api.uploadReviewMedia(productId, user?.phone, f, 'video');
      setVideo(url);
    } catch (err) { setMsg(err.message || 'Video upload failed.'); }
    setUploading(false);
  };

  const submit = async () => {
    if (!rating) { setMsg('Please pick a star rating.'); return; }
    setBusy(true); setMsg('');
    const res = await api.addReview(productId, {
      name: user?.name, phone: user?.phone, email, title, rating, text, images, video,
    });
    setBusy(false);
    if (!res.ok) {
      setMsg(res.reason === 'already' ? 'You have already reviewed this product.' : 'Could not submit review.');
      return;
    }
    setRating(0); setTitle(''); setEmail(''); setText(''); setImages([]); setVideo('');
    setMsg('Thanks! Your review is posted.');
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
            <input className={inputCls} placeholder="Review title (e.g. Perfect fit & quality!)" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
            <textarea
              className="mb-3 w-full resize-y rounded-[14px] border border-[#eee3f3] px-3.5 py-3 font-body text-[0.95rem] focus:border-orchid-500 focus:outline-none"
              placeholder="Tell others what you loved about it…"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
            />
            <input className={inputCls} placeholder="Email (optional — for order verification)" value={email} onChange={e => setEmail(e.target.value)} />

            {/* Media */}
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <label className="btn btn-ghost cursor-pointer text-[0.85rem]">
                📷 Add photos
                <input type="file" accept="image/*" multiple className="hidden" onChange={onImages} disabled={uploading || images.length >= 5} />
              </label>
              <label className="btn btn-ghost cursor-pointer text-[0.85rem]">
                🎬 Add video
                <input type="file" accept="video/*" className="hidden" onChange={onVideo} disabled={uploading} />
              </label>
              {uploading && <span className="text-[0.82rem] text-ink-soft">Uploading…</span>}
            </div>

            {(images.length > 0 || video) && (
              <div className="mb-3 flex flex-wrap gap-2">
                {images.map((u, i) => (
                  <div key={i} className="relative">
                    <img src={u} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                            className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#c4495b] text-[11px] font-bold text-white">✕</button>
                  </div>
                ))}
                {video && (
                  <div className="relative">
                    <video src={video} className="h-16 w-16 rounded-lg object-cover" />
                    <button type="button" onClick={() => setVideo('')}
                            className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#c4495b] text-[11px] font-bold text-white">✕</button>
                  </div>
                )}
              </div>
            )}

            <button className="btn btn-primary" onClick={submit} disabled={busy || uploading}>
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
                <span className="flex items-center gap-2 font-semibold">
                  {r.name}
                  {r.verified !== false && <span className="rounded-full bg-[#e8f7ee] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2e9e6b]">✓ Verified buyer</span>}
                </span>
                <Stars value={r.rating} />
              </div>
              {r.title && <p className="mb-1 font-semibold text-ink">{r.title}</p>}
              {r.text && <p className="mb-2 mt-1 leading-[1.6] text-ink-soft">{r.text}</p>}

              {(r.images?.length > 0 || r.video) && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {r.images?.map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noreferrer">
                      <img src={u} alt="" className="h-20 w-20 rounded-lg object-cover" loading="lazy" />
                    </a>
                  ))}
                  {r.video && <video src={r.video} controls className="h-28 rounded-lg" />}
                </div>
              )}

              <span className="text-[0.78rem] text-ink-soft opacity-80">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>

              {r.reply?.text && (
                <div className="mt-3 rounded-xl border-l-2 border-orchid-300 bg-[#faf7fd] px-3.5 py-2.5">
                  <p className="text-[0.8rem] font-bold text-orchid-600">Dillora replied</p>
                  <p className="mt-0.5 text-[0.9rem] text-ink-soft">{r.reply.text}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
