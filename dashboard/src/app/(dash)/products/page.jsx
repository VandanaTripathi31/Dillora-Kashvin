'use client';
import { useEffect, useState } from 'react';
import { Search, Lock, Unlock, History } from 'lucide-react';
import { api } from '@/services/api';
import { CATEGORIES } from '@/constants/catalog';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import { confirmDialog } from '@/components/ConfirmRoot';
import MediaUpload from '@/components/MediaUpload';
import { productImg } from '@/lib/img';

const blank = { name:'', category:'mobile-covers', sub:'', price:'', mrp:'', stock:'', image:'', optionType:'none' };

export default function AdminProducts() {
  const { admin } = useAuth();
  const canManageLock = admin?.role === 'owner' || admin?.role === 'manager';

  const [products, setProducts] = useState(null);
  const [cats, setCats] = useState(CATEGORIES);
  const [editing, setEditing] = useState(null); // product or 'new'
  const [form, setForm] = useState(blank);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 1 });
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkMsg, setBulkMsg] = useState('');
  const [selected, setSelected] = useState(() => new Set()); // product ids selected for bulk delete
  // stock lock
  const [admins, setAdmins] = useState([]);
  const [lockEditor, setLockEditor] = useState('');
  const [history, setHistory] = useState(null);

  const load = () => api.getProducts().then(setProducts);
  useEffect(() => { load(); api.getCategories().then(setCats); }, []);
  useEffect(() => {
    if (canManageLock) api.getAdmins().then((a) => setAdmins(Array.isArray(a) ? a : [])).catch(() => {});
  }, [canManageLock]);

  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (p) => {
    setForm({ ...p, price:String(p.price), mrp:String(p.mrp||''), stock:String(p.stock??'') });
    setLockEditor(p.stockLock?.editorEmail || '');
    setHistory(null);
    setEditing(p);
  };
  const close = () => setEditing(null);

  // ---- stock lock actions ----
  const doLock = async () => {
    const res = await api.lockProduct(editing.id, lockEditor);
    if (res?.error) { notify(res.error, 'error'); return; }
    setEditing(res); load(); notify('Product locked');
  };
  const doUnlock = async () => {
    const res = await api.unlockProduct(editing.id);
    if (res?.error) { notify(res.error, 'error'); return; }
    setEditing(res); setLockEditor(''); load(); notify('Product unlocked', 'info');
  };
  const changeEditor = async (email) => {
    setLockEditor(email);
    if (!editing?.stockLock?.locked) return; // applied on lock when not yet locked
    const res = await api.setProductEditor(editing.id, email);
    if (res?.error) { notify(res.error, 'error'); return; }
    setEditing(res); notify('Assigned editor updated');
  };
  const loadHistory = async () => {
    setHistory('loading');
    const h = await api.getStockHistory(editing.id);
    setHistory(Array.isArray(h) ? h : []);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) { notify('Please enter a product name.', 'error'); return; }
    const data = {
      name: form.name.trim(), category: form.category, sub: form.sub,
      price: Number(form.price) || 0, mrp: Number(form.mrp) || 0,
      stock: Number(form.stock) || 0, image: form.image, optionType: form.optionType,
    };
    setSaving(true);
    try {
      if (editing === 'new') await api.createProduct(data);
      else await api.updateProduct(editing.id, data);
      notify(editing === 'new' ? 'Product added' : 'Changes saved');
      close(); load();
    } catch (err) {
      notify(err.message || 'Could not save changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const del = async (p) => {
    const ok = await confirmDialog({ title: 'Delete product?', message: `“${p.name}” will be permanently removed.`, confirmLabel: 'Delete' });
    if (ok) { await api.deleteProduct(p.id); notify('Product deleted', 'info'); load(); }
  };

  // ---- Multi-select bulk delete ----
  const toggleOne = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const clearSelection = () => setSelected(new Set());
  const delSelected = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    const ok = await confirmDialog({
      title: `Delete ${ids.length} product${ids.length === 1 ? '' : 's'}?`,
      message: 'The selected products will be permanently removed.',
      confirmLabel: `Delete ${ids.length}`,
    });
    if (!ok) return;
    for (const id of ids) await api.deleteProduct(id);
    notify(`Deleted ${ids.length} product${ids.length === 1 ? '' : 's'}`, 'info');
    clearSelection();
    load();
  };

  // CSV export of all products
  const exportCsv = () => {
    const headers = ['name','category','sub','price','mrp','stock','optionType','image'];
    const rows = products.map(p => headers.map(h => {
      const v = p[h] ?? '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dillora-products-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Bulk upload: paste CSV-style lines "name,category,sub,price,mrp,stock,optionType,image"
  const runBulk = async () => {
    setBulkMsg('');
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    const rows = [];
    for (let line of lines) {
      // skip a header row if present
      if (/^name\s*,/i.test(line)) continue;
      const parts = line.split(',').map(s => s.trim());
      if (!parts[0]) continue;
      rows.push({
        name: parts[0], category: parts[1] || 'mobile-covers', sub: parts[2] || '',
        price: parts[3], mrp: parts[4], stock: parts[5], optionType: parts[6] || 'none', image: parts[7] || '',
      });
    }
    if (rows.length === 0) { setBulkMsg('No valid rows found.'); return; }
    const res = await api.bulkCreateProducts(rows);
    setBulkMsg(`✓ Added ${res.added} product${res.added === 1 ? '' : 's'}.`);
    notify(`Added ${res.added} product${res.added === 1 ? '' : 's'}`);
    setBulkText(''); load();
  };

  if (!products) return <div className="adm__pad"><Spinner /></div>;

  const lowStockList = products.filter(p => (p.stock ?? 0) <= 8);
  const base = filter === 'all' ? products
    : filter === 'low' ? lowStockList
    : products.filter(p => p.category === filter);
  const q = query.trim().toLowerCase();
  const filtered = q ? base.filter(p => p.name.toLowerCase().includes(q)) : base;
  const shown = [...filtered].sort((a, b) => {
    const { key, dir } = sort;
    let av = a[key] ?? '', bv = b[key] ?? '';
    if (key === 'price' || key === 'stock') { av = Number(av) || 0; bv = Number(bv) || 0; return (av - bv) * dir; }
    return String(av).localeCompare(String(bv)) * dir;
  });
  const sortBy = (key) => setSort(s => s.key === key ? { key, dir: -s.dir } : { key, dir: 1 });
  const arrow = (key) => sort.key === key ? <span className="tbl__sortarrow">{sort.dir === 1 ? '▲' : '▼'}</span> : <span className="tbl__sortarrow">↕</span>;
  const subOptions = cats.find(c => c.id === form.category)?.subs || [];
  const shownIds = shown.map(p => p.id);
  const allShownSelected = shownIds.length > 0 && shownIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(prev => {
    const next = new Set(prev);
    if (allShownSelected) shownIds.forEach(id => next.delete(id));
    else shownIds.forEach(id => next.add(id));
    return next;
  });

  return (
    <div className="adm__pad">
      <header className="adm__head adm__head--row">
        <div><h1>Products</h1><p className="muted">Add, edit and manage everything you sell.</p></div>
        <div className="flex flex-wrap gap-2.5">
          <button className="btn btn-ghost" onClick={exportCsv}>Export CSV</button>
          <button className="btn btn-ghost" onClick={() => { setBulkOpen(true); setBulkMsg(''); }}>Bulk upload</button>
          <button className="btn btn-primary" onClick={openNew}>+ Add product</button>
        </div>
      </header>

      <div className="subtabs">
        <button className={`subtab ${filter==='all'?'subtab--on':''}`} onClick={() => setFilter('all')}>All</button>
        <button className={`subtab ${filter==='low'?'subtab--on':''}`} onClick={() => setFilter('low')}>
          Needs restock {lowStockList.length > 0 && <span className="pill pill--bad" style={{ marginLeft:6 }}>{lowStockList.length}</span>}
        </button>
        {cats.map(c => <button key={c.id} className={`subtab ${filter===c.id?'subtab--on':''}`} onClick={() => setFilter(c.id)}>{c.name}</button>)}
      </div>

      <div className="adm__searchrow">
        <div className="adm__search">
          <Search className="w-[18px] h-[18px]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products by name…" />
          {query && <button className="adm__searchclear" onClick={() => setQuery('')}>✕</button>}
        </div>
        <span className="muted" style={{ fontSize: '.85rem' }}>{shown.length} of {products.length} shown</span>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orchid-200 bg-orchid-50 px-4 py-3">
          <span className="text-sm font-semibold text-orchid-700">{selected.size} selected</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={clearSelection}>Clear</button>
            <button className="btn btn-danger" onClick={delSelected}>Delete selected</button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="tbl tbl--prod">
          <thead><tr>
            <th className="w-[44px] text-center">
              <input type="checkbox" className="h-4 w-4 cursor-pointer accent-orchid-500 align-middle" checked={allShownSelected} onChange={toggleAll} aria-label="Select all shown" />
            </th>
            <th className={`tbl__sort ${sort.key==='name'?'tbl__sort--on':''}`} onClick={() => sortBy('name')}>Product {arrow('name')}</th>
            <th>Category</th>
            <th className={`tbl__sort ${sort.key==='price'?'tbl__sort--on':''}`} onClick={() => sortBy('price')}>Price {arrow('price')}</th>
            <th className={`tbl__sort ${sort.key==='stock'?'tbl__sort--on':''}`} onClick={() => sortBy('stock')}>Stock {arrow('stock')}</th>
            <th></th>
          </tr></thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={6} className="p-9 text-center text-ink-soft">
                {query ? `No products match “${query}”.` : 'No products here yet.'}
              </td></tr>
            ) : shown.map(p => (
              <tr key={p.id} className={selected.has(p.id) ? 'bg-orchid-50/60' : ''}>
                <td className="text-center">
                  <input type="checkbox" className="h-4 w-4 cursor-pointer accent-orchid-500 align-middle" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Select ${p.name}`} />
                </td>
                <td className="tbl__prod">
                  <img src={productImg(p.image)} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                  <span>{p.name}</span>
                </td>
                <td>{cats.find(c=>c.id===p.category)?.name}<br/><small className="muted">{cats.find(c=>c.id===p.category)?.subs.find(s=>s.id===p.sub)?.name || ''}</small></td>
                <td>₹{p.price}{p.mrp ? <><br/><small className="strike">₹{p.mrp}</small></> : null}</td>
                <td>
                  <span className="inline-flex items-center gap-1.5">
                    {(p.stock ?? 0) <= 8 ? <span className="pill pill--bad">{p.stock ?? 0}</span> : p.stock}
                    {p.stockLock?.locked && <Lock className="h-3.5 w-3.5 text-orchid-500" title="Stock locked" />}
                  </span>
                </td>
                <td className="tbl__actions">
                  <button onClick={() => openEdit(p)}>Edit</button>
                  <button className="tbl__del" onClick={() => del(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal" onClick={close}>
          <div className="modal__box" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <h3>{editing === 'new' ? 'Add product' : 'Edit product'}</h3>
              <button className="modal__x" onClick={close} aria-label="Close">✕</button>
            </div>
            <div className="formgrid">
              <label className="field field--2"><span>Name</span><input value={form.name} onChange={set('name')} /></label>
              <label className="field"><span>Category</span>
                <select value={form.category} onChange={e => setForm(f => ({...f, category:e.target.value, sub:''}))}>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Sub-category</span>
                <select value={form.sub} onChange={set('sub')}>
                  <option value="">—</option>
                  {subOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Price (₹)</span><input value={form.price} onChange={set('price')} /></label>
              <label className="field"><span>MRP (₹)</span><input value={form.mrp} onChange={set('mrp')} /></label>
              <label className="field">
                <span>Stock {editing?.stockLock?.locked && <span className="muted" title="Unlock below to edit stock">🔒 locked</span>}</span>
                <input
                  value={form.stock}
                  onChange={set('stock')}
                  disabled={!!editing?.stockLock?.locked}
                  title={editing?.stockLock?.locked ? 'Stock is locked — unlock it first to edit.' : undefined}
                  style={editing?.stockLock?.locked ? { opacity: 0.6, cursor: 'not-allowed', background: '#f4f0f8' } : undefined}
                />
              </label>
              <label className="field"><span>Option type</span>
                <select value={form.optionType} onChange={set('optionType')}>
                  <option value="none">None</option>
                  <option value="phone">Phone model</option>
                  <option value="size">T-shirt size</option>
                </select>
              </label>
              <label className="field field--2"><span>Product image</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input value={form.image} onChange={set('image')} placeholder="https://… or upload to Cloudinary" style={{ flex:1 }} />
                  <MediaUpload kind="image" onUploaded={(url) => setForm(f => ({ ...f, image: url }))} />
                </div>
              </label>
            </div>
            {form.image && <img src={productImg(form.image)} alt="" className="modal__preview" />}

            {/* Stock lock (existing products only) */}
            {editing !== 'new' && (
              <div className="mt-4 rounded-xl border border-[#eee3f3] bg-[#faf7fd] p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <strong className="inline-flex items-center gap-1.5">
                    {editing.stockLock?.locked ? <Lock className="h-4 w-4 text-orchid-500" /> : <Unlock className="h-4 w-4 text-ink-soft" />}
                    Stock lock
                  </strong>
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
                    {editing.stockLock?.locked ? 'Locked' : 'Unlocked'}
                  </span>
                </div>

                {editing.stockLock?.locked && editing.stockLock?.lockedBy && (
                  <p className="muted mb-2 text-[12px]">
                    Locked by {editing.stockLock.lockedBy}{editing.stockLock.lockedAt ? ` · ${new Date(editing.stockLock.lockedAt).toLocaleDateString('en-IN')}` : ''}
                  </p>
                )}

                {canManageLock ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="flex-1 text-[0.8rem] font-semibold text-ink-soft">
                      Assigned editor (optional)
                      <select
                        value={lockEditor}
                        onChange={(e) => changeEditor(e.target.value)}
                        className="mt-1 h-10 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
                      >
                        <option value="">No specific editor</option>
                        {admins.map((a) => <option key={a.email} value={a.email}>{a.name} ({a.role})</option>)}
                      </select>
                    </label>
                    {editing.stockLock?.locked ? (
                      <button className="btn inline-flex items-center gap-2" onClick={doUnlock}><Unlock className="h-4 w-4" /> Unlock</button>
                    ) : (
                      <button className="btn btn-primary inline-flex items-center gap-2" onClick={doLock}><Lock className="h-4 w-4" /> Lock</button>
                    )}
                  </div>
                ) : (
                  <p className="muted text-[13px]">
                    {editing.stockLock?.locked
                      ? 'This product is locked. Only an owner/manager or the assigned editor can change it.'
                      : 'Only an owner or manager can lock products.'}
                  </p>
                )}

                {/* Stock history */}
                <div className="mt-3 border-t border-[#eee3f3] pt-3">
                  {history === null ? (
                    <button className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-orchid-600 hover:text-orchid-700" onClick={loadHistory}>
                      <History className="h-4 w-4" /> View stock history
                    </button>
                  ) : history === 'loading' ? (
                    <span className="muted text-[13px]">Loading history…</span>
                  ) : history.length === 0 ? (
                    <span className="muted text-[13px]">No stock changes recorded yet.</span>
                  ) : (
                    <ul className="max-h-40 space-y-1 overflow-y-auto">
                      {history.map((h) => (
                        <li key={h.id} className="flex justify-between gap-2 text-[12.5px]">
                          <span className="text-ink">{h.oldStock} → <b>{h.newStock}</b> <span className="muted">({h.delta >= 0 ? '+' : ''}{h.delta} · {h.reason})</span></span>
                          <span className="muted whitespace-nowrap">{h.actor} · {new Date(h.createdAt).toLocaleDateString('en-IN')}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="modal__actions">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : (editing==='new'?'Add product':'Save changes')}</button>
            </div>
          </div>
        </div>
      )}

      {bulkOpen && (
        <div className="modal" onClick={() => setBulkOpen(false)}>
          <div className="modal__box" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <h3>Bulk upload products</h3>
              <button className="modal__x" onClick={() => setBulkOpen(false)} aria-label="Close">✕</button>
            </div>
            <p className="muted" style={{ fontSize:'.88rem', marginBottom:12 }}>
              Paste one product per line, comma-separated, in this order:<br/>
              <code style={{ fontSize:'.8rem' }}>name, category, sub, price, mrp, stock, optionType, imageURL</code><br/>
              Category must be one of: {CATEGORIES.map(c => c.id).join(', ')}. optionType: none / phone / size.
            </p>
            <textarea className="opt__select opt__textarea" rows={7} value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                      placeholder={"Cute Cat Charm, mobile-charms, beads, 149, 249, 30, none, https://...\nBlue Resin Tray, resin-art, , 699, 999, 10, resin, https://..."} />
            {bulkMsg && <p style={{ color: bulkMsg.startsWith('✓') ? 'var(--ok)' : 'var(--danger)', fontWeight:600, marginTop:10 }}>{bulkMsg}</p>}
            <div className="modal__actions">
              <button className="btn btn-ghost" onClick={() => setBulkOpen(false)}>Close</button>
              <button className="btn btn-primary" onClick={runBulk}>Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
