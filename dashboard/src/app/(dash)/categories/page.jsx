'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import { confirmDialog } from '@/components/ConfirmRoot';

export default function AdminCategories() {
  const [cats, setCats] = useState(null);
  const [drafts, setDrafts] = useState({});   // { categoryId: "typed name" }
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const load = () => api.getCategories().then(setCats);
  useEffect(() => { load(); }, []);

  const addSub = async (catId) => {
    const name = (drafts[catId] || '').trim();
    if (!name) return;
    setBusy(catId); setErr('');
    const res = await api.addSub(catId, name);
    setBusy('');
    if (!res.ok) { setErr(res.error || 'Could not add'); notify(res.error || 'Could not add', 'error'); return; }
    setDrafts(d => ({ ...d, [catId]: '' }));
    load(); notify('Sub-category added');
  };

  const removeSub = async (catId, subId) => {
    const ok = await confirmDialog({ title: 'Remove sub-category?', message: 'Products already in it stay, but the tab disappears from the website.', confirmLabel: 'Remove' });
    if (!ok) return;
    await api.removeSub(catId, subId);
    load(); notify('Sub-category removed', 'info');
  };

  if (!cats) return <div className="adm__pad"><Spinner /></div>;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Categories</h1>
        <p className="muted">Add or remove sub-categories inside each category. New ones appear on the website instantly. The 5 main categories are fixed.</p>
      </header>

      {err && <div className="mb-4 rounded-xl border border-[#f3c0c8] bg-[#fdeaed] px-4 py-3 text-sm font-semibold text-[#b03a4c]">{err}</div>}

      <div className="grid gap-5 lg:grid-cols-2">
        {cats.map(cat => (
          <section key={cat.id} className="card adm__panel">
            <div className="adm__panelhead">
              <h3>{cat.name}</h3>
              <span className="muted text-[13px]">{cat.subs.length} sub-categories</span>
            </div>

            <div className="my-3 flex flex-wrap gap-2">
              {cat.subs.length === 0 ? (
                <span className="muted text-sm">No sub-categories yet — add one below.</span>
              ) : cat.subs.map(s => (
                <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-orchid-100 px-2.5 py-1.5 text-sm">
                  {s.name}
                  <button onClick={() => removeSub(cat.id, s.id)} aria-label={`Remove ${s.name}`}
                          className="cursor-pointer border-none bg-transparent font-bold leading-none text-orchid-500 hover:text-orchid-700">
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={drafts[cat.id] || ''}
                onChange={e => setDrafts(d => ({ ...d, [cat.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addSub(cat.id); }}
                placeholder={`New sub-category in ${cat.name}…`}
                className="h-11 flex-1 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none"
              />
              <button className="btn btn-primary" onClick={() => addSub(cat.id)} disabled={busy === cat.id}>
                {busy === cat.id ? 'Adding…' : 'Add'}
              </button>
            </div>
          </section>
        ))}
      </div>

      <p className="muted mt-[18px] text-[13px]">
        Sub-categories you add are saved to the database and appear on the storefront instantly.
      </p>
    </div>
  );
}
