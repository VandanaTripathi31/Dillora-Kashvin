'use client';
import { useEffect, useState } from 'react';
import { api } from '@/data/api';
import { CATEGORIES } from '@/data/catalog';
import { Spinner } from '@/components/UI';

const blank = { name:'', category:'mobile-covers', sub:'', price:'', mrp:'', stock:'', image:'', optionType:'none' };

export default function AdminProducts() {
  const [products, setProducts] = useState(null);
  const [cats, setCats] = useState(CATEGORIES);
  const [editing, setEditing] = useState(null); // product or 'new'
  const [form, setForm] = useState(blank);
  const [filter, setFilter] = useState('all');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkMsg, setBulkMsg] = useState('');

  const load = () => api.getProducts().then(setProducts);
  useEffect(() => { load(); api.getCategories().then(setCats); }, []);

  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (p) => { setForm({ ...p, price:String(p.price), mrp:String(p.mrp||''), stock:String(p.stock??'') }); setEditing(p); };
  const close = () => setEditing(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    const data = {
      name: form.name, category: form.category, sub: form.sub,
      price: Number(form.price) || 0, mrp: Number(form.mrp) || 0,
      stock: Number(form.stock) || 0, image: form.image, optionType: form.optionType,
    };
    if (editing === 'new') await api.createProduct(data);
    else await api.updateProduct(editing.id, data);
    close(); load();
  };

  const del = async (p) => {
    if (confirm(`Delete "${p.name}"?`)) { await api.deleteProduct(p.id); load(); }
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
    setBulkText(''); load();
  };

  if (!products) return <div className="adm__pad"><Spinner /></div>;

  const lowStockList = products.filter(p => (p.stock ?? 0) <= 8);
  const shown = filter === 'all' ? products
    : filter === 'low' ? lowStockList
    : products.filter(p => p.category === filter);
  const subOptions = cats.find(c => c.id === form.category)?.subs || [];

  return (
    <div className="adm__pad">
      <header className="adm__head adm__head--row">
        <div><h1>Products</h1><p className="muted">Add, edit and manage everything you sell.</p></div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
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

      <div className="card">
        <table className="tbl tbl--prod">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {shown.map(p => (
              <tr key={p.id}>
                <td className="tbl__prod">
                  <img src={p.image} alt="" />
                  <span>{p.name}</span>
                </td>
                <td>{cats.find(c=>c.id===p.category)?.name}<br/><small className="muted">{cats.find(c=>c.id===p.category)?.subs.find(s=>s.id===p.sub)?.name || ''}</small></td>
                <td>₹{p.price}{p.mrp ? <><br/><small className="strike">₹{p.mrp}</small></> : null}</td>
                <td>{(p.stock ?? 0) <= 8 ? <span className="pill pill--bad">{p.stock ?? 0}</span> : p.stock}</td>
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
              <button className="modal__x" onClick={close}>✕</button>
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
              <label className="field"><span>Stock</span><input value={form.stock} onChange={set('stock')} /></label>
              <label className="field"><span>Option type</span>
                <select value={form.optionType} onChange={set('optionType')}>
                  <option value="none">None</option>
                  <option value="phone">Phone model</option>
                  <option value="size">T-shirt size</option>
                </select>
              </label>
              <label className="field field--2"><span>Image URL (Cloudinary later)</span><input value={form.image} onChange={set('image')} placeholder="https://..." /></label>
            </div>
            {form.image && <img src={form.image} alt="" className="modal__preview" />}
            <div className="modal__actions">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editing==='new'?'Add product':'Save changes'}</button>
            </div>
          </div>
        </div>
      )}

      {bulkOpen && (
        <div className="modal" onClick={() => setBulkOpen(false)}>
          <div className="modal__box" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <h3>Bulk upload products</h3>
              <button className="modal__x" onClick={() => setBulkOpen(false)}>✕</button>
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
