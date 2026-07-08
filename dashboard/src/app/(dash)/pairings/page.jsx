'use client';
import { useEffect, useMemo, useState } from 'react';
import { Save, X, Plus } from 'lucide-react';
import { api } from '@/services/api';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import { productImg } from '@/lib/img';

const inputCls =
  'h-10 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none';

export default function AdminPairings() {
  const [products, setProducts] = useState(null);
  const [selId, setSelId] = useState('');
  const [draft, setDraft] = useState([]);          // related ids being edited
  const [pickQ, setPickQ] = useState('');          // product picker search
  const [addQ, setAddQ] = useState('');            // add-related search
  const [saving, setSaving] = useState(false);

  const load = () => api.getProducts().then(setProducts);
  useEffect(() => { load(); }, []);

  const byId = useMemo(() => new Map((products || []).map((p) => [p.id, p])), [products]);
  const selected = selId ? byId.get(selId) : null;
  const isCover = selected?.category === 'mobile-covers';

  const selectProduct = (p) => {
    setSelId(p.id);
    setDraft(Array.isArray(p.relatedIds) ? p.relatedIds : []);
    setAddQ('');
  };

  const pickList = useMemo(() => {
    if (!products) return [];
    const term = pickQ.trim().toLowerCase();
    return products.filter((p) => !term || p.name.toLowerCase().includes(term)).slice(0, 40);
  }, [products, pickQ]);

  const addResults = useMemo(() => {
    if (!products || !selected) return [];
    const term = addQ.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => p.id !== selId && !draft.includes(p.id) && p.name.toLowerCase().includes(term))
      .slice(0, 12);
  }, [products, selected, addQ, draft, selId]);

  const save = async () => {
    setSaving(true);
    const res = await api.updateProduct(selId, { relatedIds: draft });
    setSaving(false);
    if (res?.error) { notify(res.error, 'error'); return; }
    setProducts((ps) => ps.map((p) => (p.id === selId ? { ...p, relatedIds: draft } : p)));
    notify('Pairings saved · live on the storefront');
  };

  if (!products) return <div className="adm__pad"><Spinner /></div>;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Pair It With / Related</h1>
        <p className="muted">
          Choose which products show under a product&apos;s cross-sell section. Mobile covers show them as
          <strong> “Pair it with a charm”</strong>; everything else as <strong>“You may also like”</strong>.
          Leave empty to auto-suggest (covers → charms, others → same category).
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Product picker */}
        <section className="card adm__panel">
          <h3 className="mb-2">Products</h3>
          <input className={`${inputCls} mb-2`} placeholder="Search products…" value={pickQ} onChange={(e) => setPickQ(e.target.value)} />
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {pickList.map((p) => {
              const n = (p.relatedIds || []).length;
              return (
                <button
                  key={p.id}
                  onClick={() => selectProduct(p)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                    selId === p.id ? 'bg-orchid-100 text-ink' : 'hover:bg-[#f6eefc] text-ink-soft'
                  }`}
                >
                  {p.image && <img src={productImg(p.image)} alt="" className="h-8 w-8 rounded object-cover" />}
                  <span className="flex-1 truncate">{p.name}</span>
                  {n > 0 && <span className="shrink-0 rounded-full bg-orchid-500 px-1.5 text-[11px] font-bold text-white">{n}</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Editor */}
        <section className="card adm__panel">
          {!selected ? (
            <p className="muted">Pick a product on the left to manage its pairings.</p>
          ) : (
            <>
              <div className="adm__panelhead flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  {selected.image && <img src={productImg(selected.image)} alt="" className="h-11 w-11 rounded-lg object-cover" />}
                  <div>
                    <h3>{selected.name}</h3>
                    <span className="muted text-[12px]">
                      Shows as {isCover ? '“Pair it with a charm”' : '“You may also like”'} · {draft.length} picked
                    </span>
                  </div>
                </div>
                <button className="btn btn-primary inline-flex items-center gap-1.5" onClick={save} disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save pairings'}
                </button>
              </div>

              {/* Current pairings */}
              <div className="my-3 flex flex-wrap gap-2">
                {draft.length === 0 && <p className="muted text-sm">No manual pairings — the storefront auto-suggests {isCover ? 'charms' : 'same-category items'}.</p>}
                {draft.map((rid) => {
                  const rp = byId.get(rid);
                  return (
                    <span key={rid} className="inline-flex items-center gap-1.5 rounded-full bg-orchid-100 px-2.5 py-1.5 text-sm text-ink">
                      {rp?.image && <img src={productImg(rp.image)} alt="" className="h-5 w-5 rounded-full object-cover" />}
                      {rp?.name || rid}
                      <button onClick={() => setDraft((d) => d.filter((x) => x !== rid))} aria-label="Remove" className="font-bold text-orchid-500 hover:text-orchid-700">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Add related */}
              <label className="mt-2 block text-[13px] font-semibold text-ink-soft">Add a product</label>
              <input className={`${inputCls} mt-1`} placeholder={isCover ? 'Search charms/accessories to pair…' : 'Search products to relate…'} value={addQ} onChange={(e) => setAddQ(e.target.value)} />
              {addResults.length > 0 && (
                <div className="mt-2 flex flex-col gap-1 rounded-xl border border-[#eee3f3] p-1">
                  {addResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setDraft((d) => [...d, p.id]); setAddQ(''); }}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-soft hover:bg-[#f6eefc]"
                    >
                      {p.image && <img src={productImg(p.image)} alt="" className="h-8 w-8 rounded object-cover" />}
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="muted text-[11px]">{p.category}</span>
                      <Plus className="h-4 w-4 text-orchid-500" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
