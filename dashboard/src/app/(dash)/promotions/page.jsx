'use client';
import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { api } from '@/services/api';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import { confirmDialog } from '@/components/ConfirmRoot';

const blank = {
  name: '', description: '', active: true, priority: 0, startDate: '', endDate: '',
  buy: { scope: 'category', ref: '', qty: 2 },
  reward: { type: 'free', scope: 'category', ref: '', qty: 1, value: 0 },
  usageLimit: 0,
};

// Category/product picker (declared at module scope so it isn't recreated per render).
function RefSelect({ scope, value, onChange, cats, products }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none">
      <option value="">Choose…</option>
      {scope === 'product'
        ? products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
        : cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );
}

export default function AdminPromotions() {
  const [offers, setOffers] = useState(null);
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null); // offer or 'new'
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = () => api.getOffers().then(setOffers);
  useEffect(() => {
    load();
    api.getCategories().then((c) => setCats(Array.isArray(c) ? c : []));
    api.getProducts().then((p) => setProducts(Array.isArray(p) ? p : []));
  }, []);

  const refName = (scope, ref) => {
    if (!ref) return '—';
    if (scope === 'product') return products.find((p) => p.id === ref)?.name || ref;
    return cats.find((c) => c.id === ref)?.name || ref;
  };

  const summary = (o) => {
    const buy = `Buy ${o.buy.qty} × ${refName(o.buy.scope, o.buy.ref)}`;
    let reward;
    if (o.reward.type === 'free') reward = `get ${o.reward.qty} × ${refName(o.reward.scope, o.reward.ref)} free`;
    else if (o.reward.type === 'percent') reward = `get ${o.reward.value}% off ${refName(o.reward.scope, o.reward.ref)}`;
    else reward = `get ₹${o.reward.value} off ${refName(o.reward.scope, o.reward.ref)}`;
    return `${buy} → ${reward}`;
  };

  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (o) => {
    setForm({
      name: o.name, description: o.description || '', active: o.active, priority: o.priority || 0,
      startDate: o.startDate || '', endDate: o.endDate || '',
      buy: { ...o.buy }, reward: { ...o.reward }, usageLimit: o.usageLimit || 0,
    });
    setEditing(o);
  };
  const close = () => setEditing(null);

  const setBuy = (k, v) => setForm((f) => ({ ...f, buy: { ...f.buy, [k]: v } }));
  const setReward = (k, v) => setForm((f) => ({ ...f, reward: { ...f.reward, [k]: v } }));

  const save = async () => {
    if (!form.name.trim()) { notify('Give the offer a name.', 'error'); return; }
    if (!form.buy.ref) { notify('Choose what must be bought.', 'error'); return; }
    if (form.reward.type === 'free' && !form.reward.ref) { notify('Choose the free item.', 'error'); return; }
    setSaving(true);
    const res = editing === 'new' ? await api.createOffer(form) : await api.updateOffer(editing.id, form);
    setSaving(false);
    if (res?.error) { notify(res.error, 'error'); return; }
    notify(editing === 'new' ? 'Offer created' : 'Offer saved');
    close(); load();
  };

  const toggle = async (o) => {
    const res = await api.updateOffer(o.id, { active: !o.active });
    if (res?.error) { notify(res.error, 'error'); return; }
    load(); notify(o.active ? 'Offer disabled' : 'Offer enabled', 'info');
  };

  const del = async (o) => {
    const ok = await confirmDialog({ title: 'Delete offer?', message: `“${o.name}” will be removed.`, confirmLabel: 'Delete' });
    if (!ok) return;
    await api.deleteOffer(o.id); load(); notify('Offer deleted', 'info');
  };

  if (!offers) return <div className="adm__pad"><Spinner /></div>;

  const inputCls = 'h-10 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none';
  const labelCls = 'flex flex-col gap-1 text-[0.8rem] font-semibold text-ink-soft';

  return (
    <div className="adm__pad">
      <header className="adm__head adm__head--row">
        <div>
          <h1>Promotions</h1>
          <p className="muted">Automatic offers that apply at checkout — no code needed (e.g. “Buy 2 covers → get 1 charm free”). Coupon codes live on the Coupons page.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New offer</button>
      </header>

      <div className="flex flex-col gap-3">
        {offers.length === 0 ? (
          <div className="card p-8 text-center text-ink-soft">No promotions yet. Create one to start auto-applying offers.</div>
        ) : offers.map((o) => (
          <div key={o.id} className={`card p-4 ${o.active ? '' : 'opacity-70'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 shrink-0 text-orchid-500" />
                  <strong>{o.name}</strong>
                  {!o.active && <span className="rounded-full bg-[#f0e6f8] px-2 py-0.5 text-[11px] font-semibold uppercase text-ink-soft">Off</span>}
                </div>
                <p className="mt-1 text-[0.9rem] text-ink">{summary(o)}</p>
                <p className="muted mt-1 text-[12px]">
                  Priority {o.priority}
                  {(o.startDate || o.endDate) ? ` · ${o.startDate || '…'} → ${o.endDate || '…'}` : ''}
                  {` · Used ${o.usageCount}${o.usageLimit > 0 ? ` / ${o.usageLimit}` : ''}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="btn btn-ghost" onClick={() => toggle(o)}>{o.active ? 'Disable' : 'Enable'}</button>
                <button className="btn btn-ghost" onClick={() => openEdit(o)}>Edit</button>
                <button className="btn btn-ghost text-[#c4495b]" onClick={() => del(o)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="modal" onClick={close}>
          <div className="modal__box" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h3>{editing === 'new' ? 'New offer' : 'Edit offer'}</h3>
              <button className="modal__x" onClick={close} aria-label="Close">✕</button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={`${labelCls} sm:col-span-2`}>Name
                <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Buy 2 covers, get 1 charm free" />
              </label>
              <label className={`${labelCls} sm:col-span-2`}>Description (shown to customers)
                <input className={inputCls} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Add 2 covers and a charm — the charm’s on us!" />
              </label>

              {/* BUY */}
              <div className="rounded-xl border border-[#eee3f3] bg-[#faf7fd] p-3 sm:col-span-2">
                <p className="mb-2 text-[0.8rem] font-bold uppercase tracking-wide text-orchid-600">Trigger — customer must buy</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <label className={labelCls}>Scope
                    <select className={inputCls} value={form.buy.scope} onChange={(e) => { setBuy('scope', e.target.value); setBuy('ref', ''); }}>
                      <option value="category">Category</option>
                      <option value="product">Specific product</option>
                    </select>
                  </label>
                  <label className={labelCls}>Which
                    <RefSelect scope={form.buy.scope} value={form.buy.ref} onChange={(v) => setBuy('ref', v)} cats={cats} products={products} />
                  </label>
                  <label className={labelCls}>Quantity
                    <input type="number" min="1" className={inputCls} value={form.buy.qty} onChange={(e) => setBuy('qty', Number(e.target.value))} />
                  </label>
                </div>
              </div>

              {/* REWARD */}
              <div className="rounded-xl border border-[#eee3f3] bg-[#faf7fd] p-3 sm:col-span-2">
                <p className="mb-2 text-[0.8rem] font-bold uppercase tracking-wide text-orchid-600">Reward — customer gets</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <label className={labelCls}>Type
                    <select className={inputCls} value={form.reward.type} onChange={(e) => setReward('type', e.target.value)}>
                      <option value="free">Free item(s)</option>
                      <option value="percent">% off</option>
                      <option value="flat">₹ off</option>
                    </select>
                  </label>
                  <label className={labelCls}>Scope
                    <select className={inputCls} value={form.reward.scope} onChange={(e) => { setReward('scope', e.target.value); setReward('ref', ''); }}>
                      <option value="category">Category</option>
                      <option value="product">Specific product</option>
                    </select>
                  </label>
                  <label className={labelCls}>Which
                    <RefSelect scope={form.reward.scope} value={form.reward.ref} onChange={(v) => setReward('ref', v)} cats={cats} products={products} />
                  </label>
                  {form.reward.type === 'free' ? (
                    <label className={labelCls}>Free quantity
                      <input type="number" min="1" className={inputCls} value={form.reward.qty} onChange={(e) => setReward('qty', Number(e.target.value))} />
                    </label>
                  ) : (
                    <label className={labelCls}>{form.reward.type === 'percent' ? 'Percent (%)' : 'Amount (₹)'}
                      <input type="number" min="0" className={inputCls} value={form.reward.value} onChange={(e) => setReward('value', Number(e.target.value))} />
                    </label>
                  )}
                </div>
              </div>

              <label className={labelCls}>Priority (higher first)
                <input type="number" className={inputCls} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} />
              </label>
              <label className={labelCls}>Usage limit (0 = unlimited)
                <input type="number" min="0" className={inputCls} value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: Number(e.target.value) }))} />
              </label>
              <label className={labelCls}>Start date
                <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </label>
              <label className={labelCls}>End date
                <input type="date" className={inputCls} value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-ink sm:col-span-2">
                <input type="checkbox" className="h-4 w-4 accent-orchid-500" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Active
              </label>
            </div>

            <div className="modal__actions">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : (editing === 'new' ? 'Create offer' : 'Save changes')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
