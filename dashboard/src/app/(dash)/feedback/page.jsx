'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import { confirmDialog } from '@/components/ConfirmRoot';

const Stars = ({ n }) => (
  <span className="tracking-[1px] text-[#f5a623]">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
);

export default function AdminFeedback() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [cfg, setCfg] = useState({ enabled: false, question: 'How was your experience?' });
  const [savingCfg, setSavingCfg] = useState(false);

  const load = () => api.getAllFeedback().then(setItems);
  useEffect(() => {
    load();
    api.getSettings().then((s) => { if (s?.feedbackPopup) setCfg({ enabled: !!s.feedbackPopup.enabled, question: s.feedbackPopup.question || 'How was your experience?' }); }).catch(() => {});
  }, []);

  const saveCfg = async (override) => {
    const value = { ...cfg, ...(override || {}) };
    setCfg(value);
    setSavingCfg(true);
    const res = await api.updateSettings({ feedbackPopup: value });
    setSavingCfg(false);
    if (res?.error) { notify(res.error, 'error'); return; }
    notify('Feedback popup saved');
  };

  const exportCsv = () => {
    const rows = [['Name', 'Phone', 'Rating', 'Feedback', 'Approved', 'Date']];
    (items || []).forEach((f) => rows.push([f.name || '', f.phone || '', f.rating || '', (f.text || '').replace(/\s+/g, ' '), f.approved ? 'yes' : 'no', new Date(f.createdAt).toLocaleDateString('en-IN')]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `dillora-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const approve = async (f, val) => {
    await api.approveFeedback(f.id, val);
    notify(val ? 'Approved — now live on the site' : 'Feedback hidden', 'info');
    load();
  };
  const del = async (f) => {
    const ok = await confirmDialog({ title: 'Delete feedback?', message: `Feedback from “${f.name}” will be permanently removed.`, confirmLabel: 'Delete' });
    if (ok) { await api.deleteFeedback(f.id); notify('Feedback deleted', 'info'); load(); }
  };

  if (!items) return <div className="adm__pad"><Spinner /></div>;

  const pending = items.filter(f => !f.approved);
  const approved = items.filter(f => f.approved);
  const shown = filter === 'pending' ? pending : filter === 'approved' ? approved : items;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Feedback</h1>
        <p className="muted">Review and approve customer testimonials before they appear on the storefront.</p>
      </header>

      {/* Post-delivery feedback popup config */}
      <section className="card adm__panel mb-5">
        <div className="adm__panelhead">
          <h3>Post-delivery feedback popup</h3>
          <button className="btn btn-ghost" onClick={exportCsv} disabled={!items?.length}>⬇ Export responses (CSV)</button>
        </div>
        <p className="muted adm__hint mt-0 mb-3">When on, signed-in customers with a delivered order are asked for feedback once. Responses appear below for approval.</p>
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={cfg.enabled} onChange={(e) => saveCfg({ enabled: e.target.checked })} />
          Ask for feedback after delivery
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={cfg.question}
            onChange={(e) => setCfg((c) => ({ ...c, question: e.target.value }))}
            placeholder="How was your experience?"
            className="h-11 flex-1 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none"
          />
          <button className="btn btn-primary" onClick={() => saveCfg()} disabled={savingCfg}>{savingCfg ? 'Saving…' : 'Save'}</button>
        </div>
      </section>

      <div className="subtabs">
        <button className={`subtab ${filter === 'pending' ? 'subtab--on' : ''}`} onClick={() => setFilter('pending')}>
          Pending {pending.length > 0 && <span className="pill pill--bad ml-1.5">{pending.length}</span>}
        </button>
        <button className={`subtab ${filter === 'approved' ? 'subtab--on' : ''}`} onClick={() => setFilter('approved')}>Approved ({approved.length})</button>
        <button className={`subtab ${filter === 'all' ? 'subtab--on' : ''}`} onClick={() => setFilter('all')}>All ({items.length})</button>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr><th>Customer</th><th>Rating</th><th>Feedback</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={5} className="p-7 text-center text-ink-soft">
                {filter === 'pending' ? 'Nothing waiting for approval — you’re all caught up. 🎉' : 'Nothing here yet.'}
              </td></tr>
            ) : shown.map(f => (
              <tr key={f.id}>
                <td>{f.name}<br /><small className="muted">{f.location || '—'}</small></td>
                <td><Stars n={f.rating} /></td>
                <td className="max-w-[440px]">{f.text || <span className="muted">(no comment)</span>}<br /><small className="muted">{new Date(f.createdAt).toLocaleDateString('en-IN')}</small></td>
                <td>{f.approved ? <span className="pill pill--ok">Live</span> : <span className="pill pill--warn">Pending</span>}</td>
                <td className="tbl__actions">
                  {f.approved
                    ? <button onClick={() => approve(f, false)}>Hide</button>
                    : <button onClick={() => approve(f, true)}>Approve</button>}
                  <button className="tbl__del" onClick={() => del(f)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
