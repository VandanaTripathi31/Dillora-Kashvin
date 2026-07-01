'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Wallet, ShoppingBag, Package, TrendingUp } from 'lucide-react';

import { api } from '@/services/api';
import { Spinner } from '@/components/UI';

import { StatusPill } from '@/components/StatusPill';

export default function Dashboard() {
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState(null);

  useEffect(() => {
    api.getOrders().then(setOrders);
    api.getProducts().then(setProducts);
  }, []);

  if (!orders || !products) return <div className="adm__pad"><Spinner /></div>;

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === 'Processing').length;
  const lowStock = products.filter(p => (p.stock ?? 0) <= 8).length;

  // simple 7-bar trend from order dates
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const total = orders.filter(o => new Date(o.createdAt).toDateString() === key)
                        .reduce((s, o) => s + o.total, 0);
    return { label: d.toLocaleDateString('en-IN', { weekday:'short' }), total };
  });
  const max = Math.max(...days.map(d => d.total), 1);

  // Top products by units sold + revenue (from order items)
  const prodMap = new Map();
  const catMap = new Map();
  for (const o of orders) {
    for (const it of o.items) {
      const p = prodMap.get(it.name) || { name: it.name, units: 0, revenue: 0 };
      p.units += it.qty; p.revenue += it.price * it.qty; prodMap.set(it.name, p);
      const cat = it.category || 'Other';
      const c = catMap.get(cat) || { cat, units: 0, revenue: 0 };
      c.units += it.qty; c.revenue += it.price * it.qty; catMap.set(cat, c);
    }
  }
  const topProducts = Array.from(prodMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const topCats = Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue);
  const catMaxRev = Math.max(...topCats.map(c => c.revenue), 1);

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Overview</h1>
        <p className="muted">A quick look at how the store is doing.</p>
      </header>

      <div className="stats">
        <Stat icon={Wallet} label="Revenue" value={`₹${revenue.toLocaleString('en-IN')}`} hint="All orders" />
        <Stat icon={ShoppingBag} label="Orders" value={orders.length} hint={`${pending} processing`} />
        <Stat icon={Package} label="Products" value={products.length} hint={`${lowStock} low on stock`} />
        <Stat icon={TrendingUp} label="Avg. order" value={`₹${Math.round(revenue/orders.length || 0).toLocaleString('en-IN')}`} hint="Per order" />
      </div>

      <div className="adm__row">
        <section className="card adm__panel">
          <h3>Last 7 days</h3>
          <div className="chart">
            {days.map((d, i) => (
              <div key={i} className="chart__col">
                <div className="chart__bar" style={{ height: `${(d.total/max)*100}%` }} title={`₹${d.total}`} />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card adm__panel">
          <div className="adm__panelhead">
            <h3>Recent orders</h3>
            <Link href="/orders" className="adm__seeall">See all →</Link>
          </div>
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.slice(0, 5).map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer?.name}</td>
                  <td>₹{o.total.toLocaleString('en-IN')}</td>
                  <td><StatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="adm__row">
        <section className="card adm__panel">
          <h3>Top products</h3>
          {topProducts.length === 0 ? <p className="muted" style={{marginTop:10}}>No sales yet.</p> : (
            <table className="tbl" style={{ marginTop: 6 }}>
              <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {topProducts.map(p => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{p.units}</td>
                    <td>₹{p.revenue.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card adm__panel">
          <h3>Best categories</h3>
          <div className="catbars">
            {topCats.length === 0 ? <p className="muted" style={{marginTop:10}}>No sales yet.</p> : topCats.map(c => (
              <div key={c.cat} className="catbar">
                <div className="catbar__row">
                  <span>{c.cat}</span>
                  <span className="muted">₹{c.revenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="catbar__track"><div className="catbar__fill" style={{ width: `${(c.revenue/catMaxRev)*100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, icon: Icon }) {
  return (
    <div className="card stat">
      {Icon && <span className="stat__icon"><Icon className="w-[19px] h-[19px]" /></span>}
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      <span className="stat__hint muted">{hint}</span>
    </div>
  );
}

