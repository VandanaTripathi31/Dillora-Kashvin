'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';

import { api } from '@/data/api';
import { useAuth } from '@/context/AuthContext';

function Stars({ value, size = 'w-4 h-4' }) {
  return (
    <span className="flex gap-0.5" style={{ color: '#f5a623' }}>
      {[0, 1, 2, 3, 4].map(i => (
        <Star key={i} className={size} fill={i < value ? '#f5a623' : 'none'} stroke="#f5a623" />
      ))}
    </span>
  );
}

function Card({ name, location, rating, text }) {
  return (
    <div className="w-[300px] sm:w-[340px] shrink-0 rounded-3xl p-6 mx-3"
         style={{ background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(6px)', boxShadow: '0 10px 40px rgba(122,79,240,.12)', border: '1px solid rgba(166,79,214,.10)' }}>
      <div className="flex items-center justify-between mb-3">
        <Stars value={rating} />
        <Quote className="w-7 h-7" style={{ color: '#e7d3f6' }} />
      </div>
      <p className="font-display italic text-[1.02rem] leading-relaxed" style={{ color: '#2c2336' }}>&ldquo;{text}&rdquo;</p>
      <p className="mt-4 text-sm font-semibold" style={{ color: '#6f2c98' }}>
        {name}{location && <span className="font-normal" style={{ color: '#6b5f78' }}> · {location}</span>}
      </p>
    </div>
  );
}

export default function Testimonials() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [summary, setSummary] = useState({ avg: 0, count: 0 });
  const [formOpen, setFormOpen] = useState(false);

  const load = () => {
    api.getFeedback().then(setItems).catch(() => setItems([]));
    api.getFeedbackSummary().then(setSummary).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  if (items === null) return null; // don't flash an empty section while loading

  // Duplicate the list so the marquee loops seamlessly (only if we have enough).
  const loop = items.length ? [...items, ...items] : [];

  return (
    <section className="relative py-16 overflow-hidden"
             style={{ background: 'linear-gradient(135deg,#faf5fe 0%,#f3e9fb 50%,#e7d3f6 100%)' }}>
      {/* soft colour blobs for depth */}
      <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(166,79,214,.12)' }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(122,79,240,.12)' }} />

      <div className="relative text-center mb-10 px-5">
        <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#a64fd6' }}>Loved &amp; shared</span>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-2" style={{ color: '#2c2336' }}>What our customers say</h2>
        {summary.count > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm">
            <Stars value={Math.round(summary.avg)} />
            <strong style={{ color: '#6f2c98' }}>{summary.avg}</strong>
            <span style={{ color: '#6b5f78' }}>· {summary.count} {summary.count === 1 ? 'review' : 'reviews'}</span>
          </div>
        )}
      </div>

      {loop.length > 0 ? (
        <div className="relative flex w-max animate-[marquee_38s_linear_infinite] hover:[animation-play-state:paused]">
          {loop.map((r, i) => <Card key={i} {...r} />)}
        </div>
      ) : (
        <p className="relative text-center px-5" style={{ color: '#6b5f78' }}>
          No feedback yet — be the first to share your experience.
        </p>
      )}

      {/* Share CTA */}
      <div className="relative text-center mt-10 px-5">
        {user ? (
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>Share your experience</button>
        ) : (
          <Link href="/account" className="btn btn-ghost">Sign in to share your experience</Link>
        )}
      </div>

      {/* edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20" style={{ background: 'linear-gradient(90deg,#faf5fe,transparent)' }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20" style={{ background: 'linear-gradient(270deg,#e7d3f6,transparent)' }} />

      {formOpen && <FeedbackForm user={user} onClose={() => setFormOpen(false)} onDone={load} />}
    </section>
  );
}

function FeedbackForm({ user, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [location, setLocation] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [hadPrevious, setHadPrevious] = useState(false);

  // Pre-fill if this customer already left feedback.
  useEffect(() => {
    if (!user?.phone) return;
    api.canSubmitFeedback(user.phone).then(r => {
      if (r?.existing) {
        setHadPrevious(true);
        setRating(r.existing.rating || 0);
        setLocation(r.existing.location || '');
        setText(r.existing.text || '');
      }
    }).catch(() => {});
  }, [user?.phone]);

  const submit = async () => {
    if (!rating) { setErr('Please pick a star rating.'); return; }
    setBusy(true); setErr('');
    const res = await api.submitFeedback({
      name: user.name, phone: user.phone, location: location.trim(), rating, text: text.trim(),
    });
    setBusy(false);
    if (res?.ok) { setDone(true); onDone?.(); }
    else setErr(res?.reason === 'login' ? 'Please sign in first.' : 'Could not submit — please try again.');
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__box modal__box--sm" onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <h3>Share your experience</h3>
          <button className="modal__x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {done ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#3f9d6b] text-2xl text-white">✓</div>
            <p className="font-semibold text-ink">Thank you, {user?.name?.split(' ')[0] || 'friend'}!</p>
            <p className="muted mt-1 text-sm">Your feedback has been submitted and will appear on the site once our team approves it.</p>
            <button className="btn btn-primary mt-4" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            {hadPrevious && (
              <p className="muted mb-3 text-sm">You&apos;ve shared feedback before — updating it will resubmit it for approval.</p>
            )}
            <label className="mb-1 block text-[0.82rem] font-semibold text-ink-soft">Your rating</label>
            <div className="mb-4 flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        className="cursor-pointer border-none bg-transparent p-0 transition-transform hover:scale-110">
                  <Star className="h-8 w-8" fill={n <= rating ? '#f5a623' : 'none'} stroke="#f5a623" />
                </button>
              ))}
            </div>

            <label className="mb-1 block text-[0.82rem] font-semibold text-ink-soft">City (optional)</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mumbai"
                   className="mb-4 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 py-2.5 text-ink focus:border-orchid-500 focus:outline-none" />

            <label className="mb-1 block text-[0.82rem] font-semibold text-ink-soft">Your feedback</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
                      placeholder="Tell others what you loved about Dillora…"
                      className="w-full resize-y rounded-[14px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 py-3 text-[0.95rem] focus:border-orchid-500 focus:outline-none" />

            <p className="muted mt-2 text-xs">Your feedback is reviewed before it appears on the site.</p>
            {err && <p className="mt-2 text-sm font-semibold text-[#c4495b]">{err}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit feedback'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
