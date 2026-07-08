'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Trash2, GripVertical } from 'lucide-react';
import { api } from '@/services/api';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import { confirmDialog } from '@/components/ConfirmRoot';
import MediaUpload from '@/components/MediaUpload';

export default function AdminBrands() {
  const [brands, setBrands] = useState(null);
  const [newBrand, setNewBrand] = useState('');
  const [modelDrafts, setModelDrafts] = useState({}); // { brandId: 'typed model' }
  const [bulkDrafts, setBulkDrafts] = useState({});   // { brandId: 'multi-line paste' }
  const [busy, setBusy] = useState('');

  const load = () => api.getAllBrands().then(setBrands);
  useEffect(() => { load(); }, []);

  const setBrandLogo = async (b, logo) => {
    const res = await api.updateBrand(b.id, { logo });
    if (res?.error) { notify(res.error, 'error'); return; }
    load(); notify(logo ? 'Logo updated' : 'Logo removed');
  };

  const bulkAdd = async (b) => {
    const text = (bulkDrafts[b.id] || '').trim();
    if (!text) return;
    setBusy(`bulk-${b.id}`);
    const res = await api.addBrandModelsBulk(b.id, text);
    setBusy('');
    if (res?.error) { notify(res.error, 'error'); return; }
    setBulkDrafts((d) => ({ ...d, [b.id]: '' })); load();
    notify(`Added ${res.added} model${res.added === 1 ? '' : 's'}${res.added === 0 ? ' (all already existed)' : ''}`);
  };

  const addBrand = async () => {
    const name = newBrand.trim();
    if (!name) return;
    setBusy('new');
    const res = await api.createBrand({ name });
    setBusy('');
    if (res?.error) { notify(res.error, 'error'); return; }
    setNewBrand(''); load(); notify('Brand added');
  };

  const toggleBrand = async (b) => {
    await api.updateBrand(b.id, { active: !b.active });
    load(); notify(b.active ? 'Brand hidden from storefront' : 'Brand is now live', 'info');
  };

  const setBrandOrder = async (b, order) => {
    await api.updateBrand(b.id, { order: Number(order) || 0 });
    load();
  };

  const delBrand = async (b) => {
    const ok = await confirmDialog({
      title: `Delete ${b.name}?`,
      message: 'All of its models will be removed. Covers already ordered are unaffected.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    await api.deleteBrand(b.id); load(); notify('Brand deleted', 'info');
  };

  const addModel = async (b) => {
    const name = (modelDrafts[b.id] || '').trim();
    if (!name) return;
    setBusy(b.id);
    const res = await api.addBrandModel(b.id, { name });
    setBusy('');
    if (res?.error) { notify(res.error, 'error'); return; }
    setModelDrafts((d) => ({ ...d, [b.id]: '' })); load(); notify('Model added');
  };

  const toggleModel = async (b, m) => {
    await api.updateBrandModel(b.id, m.id, { active: !m.active });
    load();
  };

  const delModel = async (b, m) => {
    await api.removeBrandModel(b.id, m.id);
    load(); notify('Model removed', 'info');
  };

  if (!brands) return <div className="adm__pad"><Spinner /></div>;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Phone Brands &amp; Models</h1>
        <p className="muted">
          Manage the phone brands &amp; models customers pick when ordering a mobile cover.
          Hidden (inactive) brands/models stay saved but disappear from the storefront instantly.
        </p>
      </header>

      {/* Add brand */}
      <div className="card mb-5 flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
        <input
          value={newBrand}
          onChange={(e) => setNewBrand(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addBrand(); }}
          placeholder="Add a new brand (e.g. Asus)…"
          className="h-11 flex-1 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none"
        />
        <button className="btn btn-primary" onClick={addBrand} disabled={busy === 'new'}>
          {busy === 'new' ? 'Adding…' : 'Add brand'}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {brands.map((b) => {
          const activeModels = b.models.filter((m) => m.active !== false).length;
          return (
            <section key={b.id} className={`card adm__panel ${b.active ? '' : 'opacity-70'}`}>
              <div className="adm__panelhead flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  {b.logo
                    ? <img src={b.logo} alt="" className="h-9 w-9 rounded-lg border border-[#eee3f3] bg-white object-contain p-0.5" />
                    : <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f2eef7] text-[13px] font-bold text-ink-soft">{b.name.slice(0, 2)}</span>}
                  <h3>{b.name}</h3>
                  {!b.active && (
                    <span className="rounded-full bg-[#f0e6f8] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Hidden</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <MediaUpload kind="image" label={b.logo ? 'Change logo' : 'Logo'} onUploaded={(url) => setBrandLogo(b, url)} />
                  {b.logo && <button className="text-[12px] font-semibold text-ink-soft hover:text-ink" onClick={() => setBrandLogo(b, '')}>Remove</button>}
                  <span className="muted text-[13px]">{activeModels}/{b.models.length} live</span>
                </div>
              </div>

              {/* Brand controls */}
              <div className="mb-3 mt-1 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => toggleBrand(b)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                    b.active
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-[#f0e6f8] text-ink-soft hover:bg-[#e7d8f3]'
                  }`}
                  title={b.active ? 'Click to hide from storefront' : 'Click to show on storefront'}
                >
                  {b.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {b.active ? 'Live' : 'Hidden'}
                </button>

                <label className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft">
                  <GripVertical className="h-4 w-4 opacity-60" />
                  Order
                  <input
                    type="number"
                    defaultValue={b.order ?? 0}
                    onBlur={(e) => setBrandOrder(b, e.target.value)}
                    className="h-8 w-16 rounded-lg border-[1.5px] border-[#eee3f3] bg-white px-2 text-center text-ink focus:border-orchid-500 focus:outline-none"
                  />
                </label>

                <button
                  onClick={() => delBrand(b)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#b03a4c] hover:bg-[#fdeaed]"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>

              {/* Models */}
              <div className="my-3 flex flex-wrap gap-2">
                {b.models.length === 0 ? (
                  <span className="muted text-sm">No models yet — add one below.</span>
                ) : b.models.map((m) => (
                  <span
                    key={m.id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm ${
                      m.active !== false ? 'bg-orchid-100 text-ink' : 'bg-[#f2eef7] text-ink-soft line-through'
                    }`}
                  >
                    <button
                      onClick={() => toggleModel(b, m)}
                      title={m.active !== false ? 'Hide this model' : 'Show this model'}
                      className="cursor-pointer border-none bg-transparent p-0 leading-none text-current opacity-70 hover:opacity-100"
                    >
                      {m.active !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    {m.name}
                    <button
                      onClick={() => delModel(b, m)}
                      aria-label={`Remove ${m.name}`}
                      className="cursor-pointer border-none bg-transparent font-bold leading-none text-orchid-500 hover:text-orchid-700"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {/* Add model */}
              <div className="flex gap-2">
                <input
                  value={modelDrafts[b.id] || ''}
                  onChange={(e) => setModelDrafts((d) => ({ ...d, [b.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') addModel(b); }}
                  placeholder={`New model in ${b.name}…`}
                  className="h-11 flex-1 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none"
                />
                <button className="btn btn-primary" onClick={() => addModel(b)} disabled={busy === b.id}>
                  {busy === b.id ? 'Adding…' : 'Add'}
                </button>
              </div>

              {/* Bulk import models */}
              <details className="mt-2.5 group">
                <summary className="cursor-pointer list-none text-[13px] font-semibold text-orchid-600 [&::-webkit-details-marker]:hidden">＋ Bulk import models</summary>
                <p className="muted mt-1.5 text-[12px]">Paste one model per line (or comma-separated). Duplicates are skipped.</p>
                <textarea
                  value={bulkDrafts[b.id] || ''}
                  onChange={(e) => setBulkDrafts((d) => ({ ...d, [b.id]: e.target.value }))}
                  rows={4}
                  placeholder={`Galaxy S25 Ultra\nGalaxy S25+\nGalaxy S25`}
                  className="mt-1.5 w-full resize-y rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 py-2 text-[0.9rem] text-ink focus:border-orchid-500 focus:outline-none"
                />
                <button className="btn btn-primary mt-2" onClick={() => bulkAdd(b)} disabled={busy === `bulk-${b.id}`}>
                  {busy === `bulk-${b.id}` ? 'Importing…' : 'Import models'}
                </button>
              </details>
            </section>
          );
        })}
      </div>

      {brands.length === 0 && (
        <p className="muted mt-4 text-sm">No brands yet. Add your first brand above, or run <code>npm run seed:brands</code> in the backend to load a starter list.</p>
      )}
    </div>
  );
}
