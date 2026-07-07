'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import { confirmDialog } from '@/components/ConfirmRoot';

const Stars = ({ n }) => <span className="tracking-[1px] text-[#f5a623]">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;

export default function AdminReviews() {
  const [reviews, setReviews] = useState(null);
  const [filter, setFilter] = useState('all');
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const load = () => api.getAllReviews().then(setReviews);
  useEffect(() => { load(); }, []);

  const approve = async (r, approved) => {
    const res = await api.approveReview(r.id, approved);
    if (res?.error) { notify(res.error, 'error'); return; }
    load(); notify(approved ? 'Review approved' : 'Review hidden', approved ? 'success' : 'info');
  };

  const del = async (r) => {
    const ok = await confirmDialog({ title: 'Delete review?', message: 'This review will be permanently removed.', confirmLabel: 'Delete' });
    if (!ok) return;
    await api.deleteReview(r.id); load(); notify('Review deleted', 'info');
  };

  const openReply = (r) => { setReplyId(r.id); setReplyText(r.reply?.text || ''); };
  const sendReply = async (r) => {
    const res = await api.replyReview(r.id, replyText);
    if (res?.error) { notify(res.error, 'error'); return; }
    setReplyId(null); setReplyText(''); load(); notify('Reply saved');
  };

  if (!reviews) return <div className="adm__pad"><Spinner /></div>;

  const shown = filter === 'all' ? reviews
    : filter === 'approved' ? reviews.filter(r => r.approved !== false)
    : reviews.filter(r => r.approved === false);
  const hiddenCount = reviews.filter(r => r.approved === false).length;

  return (
    <div className="adm__pad">
      <header className="adm__head"><h1>Reviews</h1><p className="muted">Moderate product reviews from verified buyers — approve, hide, reply or delete.</p></header>

      <div className="subtabs">
        {[['all', 'All'], ['approved', 'Approved'], ['hidden', `Hidden${hiddenCount ? ` (${hiddenCount})` : ''}`]].map(([k, label]) => (
          <button key={k} className={`subtab ${filter === k ? 'subtab--on' : ''}`} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft">No reviews in this view.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map(r => (
            <div key={r.id} className={`card p-4 ${r.approved === false ? 'opacity-70' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{r.name}</strong>
                    <Stars n={r.rating} />
                    {r.verified !== false && <span className="rounded-full bg-[#e8f7ee] px-2 py-0.5 text-[10px] font-bold uppercase text-[#2e9e6b]">✓ Verified</span>}
                    {r.approved === false && <span className="rounded-full bg-[#fdeaed] px-2 py-0.5 text-[10px] font-bold uppercase text-[#b03a4c]">Hidden</span>}
                  </div>
                  <p className="muted mt-0.5 text-[12px]">Product {r.productId} · {new Date(r.createdAt).toLocaleDateString('en-IN')}{r.phone ? ` · ${r.phone}` : ''}{r.email ? ` · ${r.email}` : ''}</p>
                  {r.title && <p className="mt-1.5 font-semibold text-ink">{r.title}</p>}
                  {r.text && <p className="mt-1 text-[0.92rem] text-ink-soft">{r.text}</p>}

                  {(r.images?.length > 0 || r.video) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.images?.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" className="h-16 w-16 rounded-lg object-cover" /></a>
                      ))}
                      {r.video && <video src={r.video} controls className="h-20 rounded-lg" />}
                    </div>
                  )}

                  {r.reply?.text && (
                    <div className="mt-2 rounded-lg border-l-2 border-orchid-300 bg-[#faf7fd] px-3 py-2 text-[0.88rem]">
                      <span className="font-bold text-orchid-600">Your reply: </span>
                      <span className="text-ink-soft">{r.reply.text}</span>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-1.5">
                  {r.approved === false
                    ? <button className="btn btn-ghost text-emerald-700" onClick={() => approve(r, true)}>Approve</button>
                    : <button className="btn btn-ghost" onClick={() => approve(r, false)}>Hide</button>}
                  <button className="btn btn-ghost" onClick={() => openReply(r)}>Reply</button>
                  <button className="btn btn-ghost text-[#c4495b]" onClick={() => del(r)}>Delete</button>
                </div>
              </div>

              {replyId === r.id && (
                <div className="mt-3 border-t border-[#eee3f3] pt-3">
                  <textarea
                    className="w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 py-2 text-ink focus:border-orchid-500 focus:outline-none"
                    rows={2}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a public reply…"
                  />
                  <div className="mt-2 flex gap-2">
                    <button className="btn btn-primary" onClick={() => sendReply(r)}>Save reply</button>
                    <button className="btn btn-ghost" onClick={() => { setReplyId(null); setReplyText(''); }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
