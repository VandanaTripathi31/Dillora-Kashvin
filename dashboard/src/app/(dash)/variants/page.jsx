'use client';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { api } from '@/services/api';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import MediaUpload from '@/components/MediaUpload';
import { productImg } from '@/lib/img';

// Categories the spec targets for colour variants (plus an "All" escape hatch).
const TABS = [
  { id: 'tshirts', label: 'T-Shirts' },
  { id: 'crochet', label: 'Crochet' },
  { id: '', label: 'All products' },
];

const inputCls =
  'h-10 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none';

export default function AdminVariants() {
  const [products, setProducts] = useState(null);
  const [tab, setTab] = useState('tshirts');
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState('');

  const load = () => api.getProducts().then(setProducts);
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => {
    if (!products) return [];
    const term = q.trim().toLowerCase();
    return products.filter(
      (p) => (!tab || p.category === tab) && (!term || p.name.toLowerCase().includes(term))
    );
  }, [products, tab, q]);

  // Edit a product's colour list in local state (persisted on Save).
  const patchColors = (pid, fn) =>
    setProducts((ps) => ps.map((p) => (p.id === pid ? { ...p, colorOptions: fn(p.colorOptions || []) } : p)));

  const addColor = (pid) => patchColors(pid, (list) => [...list, { name: '', hex: '#cbb6e6', image: '' }]);
  const setColor = (pid, i, patch) =>
    patchColors(pid, (list) => list.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const removeColor = (pid, i) => patchColors(pid, (list) => list.filter((_, idx) => idx !== i));

  const save = async (p) => {
    const colorOptions = (p.colorOptions || [])
      .map((c) => ({ name: String(c.name || '').trim(), hex: String(c.hex || '').trim(), image: String(c.image || '').trim() }))
      .filter((c) => c.name);
    setSaving(p.id);
    const res = await api.updateProduct(p.id, { colorOptions });
    setSaving('');
    if (res?.error) { notify(res.error, 'error'); return; }
    setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, colorOptions: res.colorOptions || [] } : x)));
    notify('Colours saved · live on the storefront');
  };

  if (!products) return <div className="adm__pad"><Spinner /></div>;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Colour Variants</h1>
        <p className="muted">
          Add colour options (name + swatch) to products like T-shirts and crochet. They appear instantly as a
          colour picker on the product page. Products with no colours added simply don&apos;t show a picker.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id || 'all'}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              tab === t.id ? 'bg-orchid-500 text-white' : 'bg-[#f0e6f8] text-ink-soft hover:bg-[#e7d8f3]'
            }`}
          >
            {t.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          className={`${inputCls} ml-auto w-full max-w-[240px]`}
        />
      </div>

      <div className="grid gap-4">
        {shown.map((p) => {
          const colors = p.colorOptions || [];
          return (
            <section key={p.id} className="card adm__panel">
              <div className="adm__panelhead flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {p.image && <img src={productImg(p.image)} alt="" className="h-11 w-11 rounded-lg object-cover" />}
                  <div>
                    <h3>{p.name}</h3>
                    <span className="muted text-[12px]">{p.category}{p.sub ? ` · ${p.sub}` : ''} · {colors.length} colour{colors.length === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <button className="btn btn-primary inline-flex items-center gap-1.5" onClick={() => save(p)} disabled={saving === p.id}>
                  <Save className="h-4 w-4" /> {saving === p.id ? 'Saving…' : 'Save'}
                </button>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {colors.length === 0 && <p className="muted text-sm">No colours yet — add one below.</p>}
                {colors.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#eee3f3] bg-[#faf7fd] p-2">
                    <span
                      className="h-8 w-8 shrink-0 rounded-full border border-black/10 bg-cover bg-center"
                      style={c.image ? { backgroundImage: `url(${c.image})` } : { background: c.hex || '#e9e2f2' }}
                    />
                    <input
                      className={`${inputCls} min-w-[120px] flex-1`}
                      placeholder="Colour name (e.g. Lavender)"
                      value={c.name || ''}
                      onChange={(e) => setColor(p.id, i, { name: e.target.value })}
                    />
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(c.hex || '') ? c.hex : '#cbb6e6'}
                      onChange={(e) => setColor(p.id, i, { hex: e.target.value })}
                      className="h-10 w-12 cursor-pointer rounded-lg border-[1.5px] border-[#eee3f3] bg-white"
                      title="Swatch colour"
                    />
                    <MediaUpload label={c.image ? 'Change swatch' : 'Swatch image'} onUploaded={(url) => setColor(p.id, i, { image: url })} />
                    {c.image && (
                      <button className="text-[12px] font-semibold text-ink-soft hover:text-ink" onClick={() => setColor(p.id, i, { image: '' })}>Clear image</button>
                    )}
                    <button onClick={() => removeColor(p.id, i)} aria-label="Remove colour" className="ml-auto rounded-lg p-2 text-[#b03a4c] hover:bg-[#fdeaed]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={() => addColor(p.id)} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#eadff5] px-3.5 py-2 text-[13px] font-semibold text-orchid-600 hover:bg-[#f9f2fd]">
                <Plus className="h-4 w-4" /> Add colour
              </button>
            </section>
          );
        })}
        {shown.length === 0 && <p className="muted text-sm">No products match.</p>}
      </div>
    </div>
  );
}
