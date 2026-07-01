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

      {err && <div className="adm__error" style={{ marginBottom: 14 }}>{err}</div>}

      <div className="formgrid" style={{ display: 'grid', gap: 16 }}>
        {cats.map(cat => (
          <section key={cat.id} className="card adm__panel">
            <div className="adm__panelhead">
              <h3>{cat.name}</h3>
              <span className="muted" style={{ fontSize: 13 }}>{cat.subs.length} sub-categories</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
              {cat.subs.map(s => (
                <span key={s.id} className="subchip"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                               background: 'var(--lilac-100, #f3e9fb)', borderRadius: 999, fontSize: 14 }}>
                  {s.name}
                  <button onClick={() => removeSub(cat.id, s.id)} aria-label={`Remove ${s.name}`}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#a64fd6', fontWeight: 700, lineHeight: 1 }}>
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={drafts[cat.id] || ''}
                onChange={e => setDrafts(d => ({ ...d, [cat.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addSub(cat.id); }}
                placeholder={`New sub-category in ${cat.name}…`}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={() => addSub(cat.id)} disabled={busy === cat.id}>
                {busy === cat.id ? 'Adding…' : 'Add'}
              </button>
            </div>
          </section>
        ))}
      </div>

      <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
        Sub-categories you add are saved to the database and appear on the storefront instantly.
      </p>
    </div>
  );
}
