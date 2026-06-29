'use client';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/data/api';
import { CATEGORIES } from '@/data/catalog';
import { Spinner } from '@/components/UI';
import { StatusPill } from '@/components/StatusPill';
import { notify } from '@/components/AdminToaster';

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
const payLabel = { online:'Paid online', 'half-cod':'Half + COD', cod:'COD' };

// Group order items by their product category, preserving first-seen order.
function groupByCategory(items = []) {
  const map = new Map();
  for (const it of items) {
    const cat = it.category || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(it);
  }
  return Array.from(map, ([category, items]) => ({ category, items }));
}

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState('All');       // status filter
  const [catFilter, setCatFilter] = useState('All');  // product-type filter
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'createdAt', dir: -1 });

  const load = () => api.getOrders().then(setOrders);
  useEffect(() => { load(); }, []);

  const changeStatus = async (id, status) => {
    await api.updateOrderStatus(id, status);
    load();
    setOpen(o => o && o.id === id ? { ...o, status } : o);
    notify(`${id} marked ${status}`);
  };

  if (!orders) return <div className="adm__pad"><Spinner /></div>;

  const orderHasCat = (o, catName) => o.items.some(it => (it.category || 'Other') === catName);

  // Apply BOTH filters: status + product type.
  const byStatus = filter === 'All' ? orders : orders.filter(o => o.status === filter);
  const byCat = catFilter === 'All' ? byStatus : byStatus.filter(o => orderHasCat(o, catFilter));
  const q = query.trim().toLowerCase();
  const searched = q
    ? byCat.filter(o => o.id.toLowerCase().includes(q) || (o.customer?.name || '').toLowerCase().includes(q) || (o.customer?.phone || '').includes(q))
    : byCat;
  const shown = [...searched].sort((a, b) => {
    const { key, dir } = sort;
    if (key === 'total') return (a.total - b.total) * dir;
    return (new Date(a.createdAt) - new Date(b.createdAt)) * dir;
  });
  const sortBy = (key) => setSort(s => s.key === key ? { key, dir: -s.dir } : { key, dir: -1 });
  const arrow = (key) => <span className="tbl__sortarrow">{sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : '↕'}</span>;

  // Fixed breakdown across all 5 product types (always shown, even at zero),
  // computed against the current STATUS filter so counts match the status view.
  const catStats = CATEGORIES.map(c => {
    let ords = 0, units = 0;
    for (const o of byStatus) {
      const items = o.items.filter(it => (it.category || 'Other') === c.name);
      if (items.length) { ords += 1; units += items.reduce((n, it) => n + it.qty, 0); }
    }
    return { category: c.name, orders: ords, units };
  });

  return (
    <div className="adm__pad">
      <header className="adm__head"><h1>Orders</h1><p className="muted">Track and update every order.</p></header>

      <div className="subtabs">
        {['All', ...STATUSES].map(s => (
          <button key={s} className={`subtab ${filter===s?'subtab--on':''}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      {/* Segregation: orders by product type (always shows all 5, clickable to filter) */}
      <div className="catstats">
        <div className="catstats__label">
          By product type
          <span className="muted"> · {filter === 'All' ? 'all orders' : filter.toLowerCase()}{catFilter !== 'All' ? ` · showing ${catFilter}` : ''}</span>
        </div>
        <div className="catstats__grid">
          <button
            className={`catstat catstat--all card ${catFilter === 'All' ? 'catstat--on' : ''}`}
            onClick={() => setCatFilter('All')}>
            <span className="catstat__cat">All products</span>
            <span className="catstat__orders">{byStatus.length}</span>
            <span className="catstat__sub muted">{byStatus.length === 1 ? 'order' : 'orders'}</span>
          </button>
          {catStats.map(c => (
            <button
              key={c.category}
              className={`catstat card ${catFilter === c.category ? 'catstat--on' : ''} ${c.orders === 0 ? 'catstat--empty' : ''}`}
              onClick={() => setCatFilter(catFilter === c.category ? 'All' : c.category)}>
              <span className="catstat__cat">{c.category}</span>
              <span className="catstat__orders">{c.orders}</span>
              <span className="catstat__sub muted">{c.orders === 1 ? 'order' : 'orders'} · {c.units} {c.units === 1 ? 'item' : 'items'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="adm__searchrow">
        <div className="adm__search">
          <Search className="w-[18px] h-[18px]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by order ID, name or phone…" />
          {query && <button className="adm__searchclear" onClick={() => setQuery('')} aria-label="Clear search">✕</button>}
        </div>
        <span className="muted" style={{ fontSize: '.85rem' }}>{shown.length} {shown.length === 1 ? 'order' : 'orders'}</span>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr>
            <th className={`tbl__sort ${sort.key==='createdAt'?'tbl__sort--on':''}`} onClick={() => sortBy('createdAt')}>Order {arrow('createdAt')}</th>
            <th>Customer</th><th>Items</th>
            <th className={`tbl__sort ${sort.key==='total'?'tbl__sort--on':''}`} onClick={() => sortBy('total')}>Total {arrow('total')}</th>
            <th>Payment</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:'28px', color:'var(--ink-soft)' }}>
                No orders match this view.
              </td></tr>
            ) : shown.map(o => (
              <tr key={o.id}>
                <td>{o.id}<br/><small className="muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</small></td>
                <td>{o.customer?.name}<br/><small className="muted">{o.customer?.phone}</small></td>
                <td>{o.items.reduce((n,i)=>n+i.qty,0)}</td>
                <td>₹{o.total.toLocaleString('en-IN')}</td>
                <td><small>{payLabel[o.payment] || o.payment}</small></td>
                <td><StatusPill status={o.status} /></td>
                <td className="tbl__actions"><button onClick={() => setOpen(o)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal" onClick={() => setOpen(null)}>
          <div className="modal__box" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <h3>Order {open.id}</h3>
              <button className="modal__x" onClick={() => setOpen(null)} aria-label="Close">✕</button>
            </div>
            <div className="ordview">
              <div className="ordview__cust">
                <strong>{open.customer?.name}</strong>
                <span className="muted">{open.customer?.phone}</span>
                <span className="muted">{open.customer?.address}</span>
              </div>
              <div className="ordview__items">
                {groupByCategory(open.items).map(group => (
                  <div key={group.category} className="ordgroup">
                    <div className="ordgroup__head">{group.category}</div>
                    {group.items.map((it, i) => (
                      <div key={i} className="summary__item ordgroup__item">
                        <span>
                          {it.name} <em className="muted">×{it.qty}</em>
                          <br/><small className="muted">{it.options}</small>
                          {it.refPhoto && (
                            <a className="ordref" href={it.refPhoto} target="_blank" rel="noreferrer">
                              <img src={it.refPhoto} alt="reference" />
                              <span>View reference photo</span>
                            </a>
                          )}
                        </span>
                        <span>₹{(it.price*it.qty).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="summary__row summary__total"><span>Total</span><span>₹{open.total.toLocaleString('en-IN')}</span></div>
                <div className="summary__row"><span>Payment</span><span>{payLabel[open.payment] || open.payment}</span></div>
              </div>
              <div className="ordview__status">
                <label className="opt__label">Update status</label>
                <div className="opt__row">
                  {STATUSES.map(s => (
                    <button key={s} className={`opt__pill ${open.status===s?'opt__pill--on':''}`}
                            onClick={() => changeStatus(open.id, s)}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
